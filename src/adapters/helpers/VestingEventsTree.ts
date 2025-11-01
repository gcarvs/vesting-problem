import { VestingEvent } from "../../domain/models/VestingEvent";

/**
 * Binary Search Tree Node
 */
class VestingEventsTreeNode {
    values: VestingEvent[];
    left: VestingEventsTreeNode | null;
    right: VestingEventsTreeNode | null;

    constructor(initialValue?: VestingEvent) {
        this.values = initialValue ? [initialValue] : [];
        this.left = null;
        this.right = null;
    }
}

/**
 * Compares two VestingEvent based on their dates.
 * 
 * @param eventA 
 * @param eventB 
 * @returns {number} - Return -1 if A < B, 1 if A > B or 0 if they happened on the same date
 */
export const indexByEventDate = (eventA: VestingEvent, eventB: VestingEvent) => {
    if (eventA.awardDate < eventB.awardDate)
        return -1
    else if (eventA.awardDate > eventB.awardDate)
        return 1
    return 0;
};

/**
 * Compares two VestingEvent based on their Employee Ids and Award ID.
 * 
 * @param eventA 
 * @param eventB 
 * @returns {number} - Return -1 if A < B, 1 if A > B or 0 if they are from the same Employee and Award.
 */
export const indexByEmployeeAndEvent = (eventA: VestingEvent, eventB: VestingEvent) => {
    const employeeIdCompare = eventA.awardId.localeCompare(eventB.employeeId);

    if(employeeIdCompare !== 0) return employeeIdCompare;

    return eventA.awardId.localeCompare(eventB.awardId)
};


/**
 * An implementation of a modified Binary Search Tree used to optimize the read and search operations on the VestingEvents data.
 * 
 * This should help to optimize for cases where the file is too big, making most operation in O(log n) time.
 */
export class VestingEventsTree {
    private root: VestingEventsTreeNode;

    // Function that will used to compare to events and determine if it should be left, right or even in the tree.
    indexingFunction: (eventA: VestingEvent, eventB: VestingEvent) => number;

    constructor(indexer: (eventA: VestingEvent, eventB: VestingEvent) => number) {
        this.root = null;
        this.indexingFunction = indexer;
    }

    /**
     * Inserts a new value into the Tree.
     * 
     * @param {VestingEvent} value - A new Vesting Event 
     */
    insert(newEvent: VestingEvent): void {
        this.root = this.insertNode(newEvent, this.root);
    }

    /**
     * Recursive helper function used to find the correct node to insert the new value.
     * 
     * @param {VestingEvent} newEvent - The new event to be included in the tree
     * @param {VestingEventsTreeNode} node - The current node being evaluated
     * @returns {VestingEventsTreeNode} - The node where the new value was inserted
     */
    private insertNode(newEvent: VestingEvent, node?: VestingEventsTreeNode): VestingEventsTreeNode {
        // Base case for when the tree is empty
        if (!node) {
            return new VestingEventsTreeNode(newEvent);
        }

        // Values with the same index are stored in the same node.
        // For the sake o comparison, we can just get the first value as all have the same key.
        const nodeFirstValue = node.values[0];
        const compareResult = this.indexingFunction(newEvent, nodeFirstValue);
        
        if (compareResult < 0) {
            node.left = this.insertNode(newEvent, node.left);
        } else if (compareResult > 0) {
            node.right = this.insertNode(newEvent, node.right);
        } else {
            node.values.push(newEvent);
        }

        return node;
    }

    /**
     * Searches for a node in the tree.
     * 
     * @param {VestingEvent} value - The node being searched
     * @returns {VestingEventsTreeNode | null} - The node containing the event or null if the event was not found.
     */
    search(searchEvent: VestingEvent): VestingEventsTreeNode | null {
        return this.searchNode(searchEvent, this.root);
    }

    /**
     * Recursive helper function used to search for a node in the tree.
     * 
     * @param {VestingEvent} searchEvent - The event being looked for
     * @param {VestingEventsTreeNode | null} node - The node being searched
     * @returns {VestingEventsTreeNode | null} - The node containing the event or null if the event was not found.
     */
    private searchNode(searchEvent: VestingEvent, node?: VestingEventsTreeNode): VestingEventsTreeNode | null {
        if (!node) return null; // Empty tree

        const nodeFirstValue = node.values[0];
        const compareResult = this.indexingFunction(searchEvent, nodeFirstValue);

        if (compareResult === 0) return node;
        if (compareResult < 0) return this.searchNode(searchEvent, node.left);
        return this.searchNode(searchEvent, node.right);
    }

    /**
     * Removes an event from the tree.
     * 
     * @param {VestingEvent} removedEvent - The event o be removed.
     */
    remove(removedEvent: VestingEvent): void {
        this.root = this.removeNode(removedEvent, this.root);
    }

    /**
     * Recursive helper function to remove a node from the tree.
     * 
     * @param {VestingEvent} removedNode - The node to be removed
     * @param {VestingEventsTreeNode} node - The current node being searched.
     * @returns {VestingEventsTreeNode | null} - Returns the removed node, or null if the node was not found.
     */
    private removeNode(removedNode: VestingEvent, node?: VestingEventsTreeNode): VestingEventsTreeNode | null {
        if (!node) return null; // Empty tree

        const nodeFirstValue = node.values[0];
        const compareResult = this.indexingFunction(removedNode, nodeFirstValue);

        if (compareResult < 0) {
            node.left = this.removeNode(removedNode, node.left);
        } else if (compareResult > 0) {
            node.right = this.removeNode(removedNode, node.right);
        } else {
            // Node found
            if (!node.left && !node.right) {
                return null; // No children
            } else if (!node.left) {
                return node.right; // Only Right child
            } else if (!node.right) {
                return node.left; // Only Left Child
            } else {
                // Both children replace with in-order successor
                const successor = this.findMin(node.right);
                node.values = successor.values;
                node.right = this.removeNode(successor.values[0], node.right);
            }
        }

        return node;
    }

    /**
     * Finds the node with the smallest value in a subtree
     * 
     * @param {VestingEventsTreeNode} subtreeRoot - The node to represent the root of the search sub tree
     * @returns {VestingEventsTreeNode} - The node with the smallest value.
     */
    private findMin(subtreeRoot: VestingEventsTreeNode): VestingEventsTreeNode {
        while (subtreeRoot.left) subtreeRoot = subtreeRoot.left;
        return subtreeRoot;
    }

    /**
     * Traverse the tree in order
     * @returns Array of node values in traversal order.
     */
    traverse(): VestingEvent[] {
        const result: VestingEvent[] = [];

        const inOrder = (node?: VestingEventsTreeNode) => {
            if (!node) return;
            inOrder(node.left);
            result.push(...node.values);
            inOrder(node.right);
        };

        inOrder(this.root);

        return result;
    }

    /**
     * Returns true if the tree is empty.
     * 
     * @returns {boolean}
     */
    isEmpty(): boolean {
        return this.root === null;
    }
}