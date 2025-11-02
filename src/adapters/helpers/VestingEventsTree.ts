import { VestedShares } from "../../domain/models/VestedShares";

/**
 * Binary Search Tree Node
 */
class BSTNode<T> {
    value: T;
    left: BSTNode<T> | null;
    right: BSTNode<T> | null;

    constructor(initialValue?: T) {
        this.value = initialValue;
        this.left = null;
        this.right = null;
    }
}

/**
 * Compares two T based on their Employee Ids and Award Ids.
 * 
 * @param valueA 
 * @param valueB 
 * @returns {number} - Return -1 if A < B, 1 if A > B or 0 if they happened on the same date
 */
export const indexByEmployeeAndAward = (valueA: VestedShares, valueB: VestedShares) => {
    const employeeIdCompare = valueA.employeeId.localeCompare(valueB.employeeId);

    if (employeeIdCompare !== 0) return employeeIdCompare;

    return valueA.awardId.localeCompare(valueB.awardId);
};

/**
 * An implementation of a modified Binary Search Tree used to optimize the read and search operations on the data.
 * 
 * This should help to optimize for cases where the file is too big, making most operation in O(log n) time.
 */
export class BSTree<T> {
    private root: BSTNode<T>;

    // Function that will used to compare to events and determine if it should be left, right or even in the tree.
    indexingFunction: (valueA: T, valueB: T) => number;

    constructor(indexer: (valueA: T, valueB: T) => number) {
        this.root = null;
        this.indexingFunction = indexer;
    }

    /**
     * Inserts a new value into the Tree.
     * 
     * @param {T} newValue - A new value to be included in the tree
     */
    insert(newValue: T): void {
        this.root = this.insertNode(newValue, this.root);
    }

    /**
     * Recursive helper function used to find the correct node to insert the new value.
     * 
     * @param {T} newValue - The new value to be included in the tree
     * @param {BSTNode} node - The current node being evaluated
     * @returns {BSTNode} - The node where the new value was inserted
     */
    private insertNode(newValue: T, node?: BSTNode<T>): BSTNode<T> {
        // Base case for when the tree is empty
        if (!node) {
            return new BSTNode(newValue);
        }

        const compareResult = this.indexingFunction(newValue, node.value);
        
        if (compareResult < 0) {
            node.left = this.insertNode(newValue, node.left);
        } else if (compareResult > 0) {
            node.right = this.insertNode(newValue, node.right);
        } else {
            // If the node already existed, updates it
            node.value = newValue;
        }

        return node;
    }

    /**
     * Traverse the tree in order
     * @returns Array of node values in traversal order.
     */
    traverse(): T[] {
        const result: T[] = [];

        const inOrder = (node?: BSTNode<T>) => {
            if (!node) return;
            inOrder(node.left);
            result.push(node.value);
            inOrder(node.right);
        };

        inOrder(this.root);

        return result;
    }
}