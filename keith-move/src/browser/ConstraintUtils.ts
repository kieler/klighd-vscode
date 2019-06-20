import { SNode } from "sprotty";

export class ConstraintUtils {
   /**
     * Checks whether two arrays of SNodes are equal based on the id of their nodes.
     * It's explicitly no set equality. Two shuffled arrays are not equal according to this function.
     * @param ar1
     * @param ar2
     */
    public static nodeArEquals(ar1: SNode[], ar2: SNode[]): Boolean {
        if (ar1.length !== ar2.length) {
            return false
        }
        for (let i = 0; i < ar1.length; i++) {
            if (ar1[i].id !== ar2[i].id) {
                return false
            }
        }


        return true
    }

    /**
     *Checks whether two SNode arrays include the same nodes.
     * @param ar1
     * @param ar2
     */
    public static sameNodeSet(ar1: SNode[], ar2: SNode[]): Boolean {
        if (ar1.length !== ar2.length) {
            return false
        }

        for (let e1 of ar1) {
            if ( !ar1.includes(e1)) {
                return false
            }
        }

        for (let e2 of ar2) {
            if ( !ar2.includes(e2)) {
                return false
            }
        }
        return true
    }
}