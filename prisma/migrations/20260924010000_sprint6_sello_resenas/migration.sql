-- AlterTable
ALTER TABLE `sello_inclusion` ADD COLUMN `motivo_rechazo` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `resenas_id_candidato_id_empresa_key` ON `resenas`(`id_candidato`, `id_empresa`);

-- RenameIndex
ALTER TABLE `resenas` RENAME INDEX `resenas_id_empresa_fkey` TO `resenas_id_empresa_idx`;