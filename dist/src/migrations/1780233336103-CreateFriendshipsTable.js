"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFriendshipsTable1780233336103 = void 0;
const typeorm_1 = require("typeorm");
class CreateFriendshipsTable1780233336103 {
    name = 'CreateFriendshipsTable1780233336103';
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "friendships",
            columns: [
                {
                    name: "id",
                    type: "SERIAL",
                    isPrimary: true,
                },
                {
                    name: "user1Id",
                    type: "integer",
                    isNullable: false,
                },
                {
                    name: "user2Id",
                    type: "integer",
                    isNullable: false,
                },
                {
                    name: "createdAt",
                    type: "TIMESTAMP",
                    default: "now()",
                    isNullable: false,
                },
            ],
            uniques: [
                new typeorm_1.TableUnique({
                    columnNames: ["user1Id", "user2Id"],
                }),
            ],
        }), true);
    }
    async down(queryRunner) {
        await queryRunner.dropTable("friendships", true);
    }
}
exports.CreateFriendshipsTable1780233336103 = CreateFriendshipsTable1780233336103;
//# sourceMappingURL=1780233336103-CreateFriendshipsTable.js.map