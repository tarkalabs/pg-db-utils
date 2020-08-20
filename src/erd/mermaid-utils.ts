import { ErdModel } from "../structure/utils";
import { RelationshipType } from "../structure/interfaces";

const enum leftSideRelationships {
    ZeroN = "}o",
    ZeroOne = "|o",
    OneOnly = "||",
    OneN = "}|"
}
const enum rightSideRelationships {
    ZeroN = "o{",
    ZeroOne = "o|",
    OneOnly = "||",
    OneN = "|{"
}

/*
    ZeroOneToOneOnly = "|o..||",    // N/A : fk U
    ZeroOneToZeroN = "|o..o{",      // N/A : fk N
    OneOnlyToZeroOne = "||..o|",    // fk U : N/A
    OneOnlyToOneOnly = "||..||",    // fk U N-N : N/A    OR     N/A : fk U N-N
    OneOnlyToZeroN = "||..o{",      // N/A : fk N-N
    ZeroNToZeroOne = "}o..o|",      // fk N : N/A
    ZeroNToOneOnly = "}o..||",      // fk N-N : N/A
*/
export class MermaidModel {
    static getERD(model: ErdModel) {
        let out = "";
        if (model.dbStructure.relationships) {
            for (let key in model.dbStructure.relationships.items) {
                let relationship = model.dbStructure.relationships.items[key];
                let startTable = model.dbStructure.tables.items[relationship.startTable.id];
                let endTable = model.dbStructure.tables.items[relationship.endTable.id];
                if (startTable && endTable) {
                    out += "\n";
                    let startSchema = model.dbStructure.schemas.items[startTable.schema];
                    let endSchema = model.dbStructure.schemas.items[endTable.schema];
                    out += "\t" + startSchema.name.replace("_", "") + "-" + startTable.name.replace("_", "") + " " + relationship.relationshipType + " " + endSchema.name.replace("_", "") + "-" + endTable.name.replace("_", "") + " : \"\"";
                }
            }
        }

        out = "erDiagram\n" + out.split('\n').sort().join('\n');

        return out;
    }
}