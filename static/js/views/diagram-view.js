import { orgUnitsStore } from "../stores/orgUnits.store.js";
import { resolvedPoliciesStore } from "../stores/resolvedPolicies.store.js";
import { POLICIES_NAMESPACES } from "../config.js";
import { showAlert } from "../components/pageLoader.js";
import EditPolicies from "./edit-policies-view.js";

const insertChildren = (node, firstRound) => {
    let elementId = node.parentId;
    let childrenHtml = '<ul id=' + node.id + '></ul>';

    if (firstRound) {
        elementId = 'root-nodes';
    }

    if (node.children.length < 1) {
        childrenHtml = '';
    }

    document.getElementById(elementId).innerHTML += '' +
        '<li>' +
            '<div class="dropdown">' +
                '<a class="dropbtn">' +
                    '<div class="node-title">' + node.name + '</div>' +
                '</a>' +
                '<div class="dropdown-content">' +
                    '<a href="#" class="margin-bot margin-top export-policies-button" data-node-id="' + node.id + '">Download Policies</a>' +
                    '<a href="#" class="margin-bot edit-policies-button" data-node-id="' + node.id + '" data-node-path="' + node.path + '">Edit Policies</a>' +
                '</div>' +
            '</div>' +
            childrenHtml +
        '</li>';

    for (let i = 0, len = node.children.length; i < len; i++) {
        insertChildren(node.children[i], false);
    }
};

const renderEditPoliciesPage = async (elem, _policies, ouPathName) => {
    elem.innerHTML = await EditPolicies.render(_policies, ouPathName);
    await EditPolicies.post_render();
};

const Diagram = {
    /**
     * Render the component content.
     */
    render: async () => {
        return `
            <div class="info-note">
                <p>
                    <strong>Important Information!</strong>&nbsp;&nbsp;It is recommended to download settings before editing.
                    <br>
                    <br>
                    These namespaces are the one available in this version:<br>
                    + <strong>chrome.users.*</strong>
                    <br>
                    + <strong>chrome.devices.*</strong>
                </p>
            </div>
            <div class="tree">
                <ul>
                    <li id="diagramContent"></li>
                </ul>
            </div>
        `;
    },

    /**
     * DOM
     */
    post_render: async () => {
        let diagramContent = document.getElementById('diagramContent');
        let contentElement = document.getElementById('content');

        // Start page loader
        showAlert(diagramContent, true, '');

        // Get OUs data
        let orgUnitsData = await orgUnitsStore();

        if (orgUnitsData.length > 0) {
            // Inserting parent node
            diagramContent.innerHTML = '' +
                '<a><div class="node-title">Root Org Unit</div></a>' +
                '<ul id="root-nodes"></ul>';

            // Inserting children nodes
            for (let i = 0, len = orgUnitsData.length; i < len; i++) {
                insertChildren(orgUnitsData[i], true);
            }
        } else {
            // TODO: handle diagram content not loaded
        }

        diagramContent.addEventListener("click", async (event) => {

            if (event.target && event.target.getAttribute('class') && event.target.getAttribute('class').includes('edit-policies-button')) {
                let nodeId = event.target.getAttribute('data-node-id');
                let nodePath = event.target.getAttribute('data-node-path');

                // Start page loader
                showAlert(contentElement, true, 'Preparing to fetch policies...');

                let alertMessageElement = document.getElementById('loaderSubText');

                // Render edit page and process data
                let policies = await resolvedPoliciesStore(nodeId.substr(nodeId.indexOf(':') + 1), POLICIES_NAMESPACES, alertMessageElement);

                if (policies) {
                    showAlert(contentElement, false);
                    await renderEditPoliciesPage(contentElement, policies, nodePath);
                } else {
                    // TODO: call diagram back -- maybe use Events
                }
            }
        });
    }
};

export default Diagram;
