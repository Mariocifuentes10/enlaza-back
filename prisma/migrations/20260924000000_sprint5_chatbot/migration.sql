-- CreateTable
CREATE TABLE `conversaciones_chatbot` (
    `id_mensaje` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `rol` VARCHAR(20) NOT NULL,
    `contenido` TEXT NOT NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `conversaciones_chatbot_id_usuario_creado_en_idx`(`id_usuario`, `creado_en`),
    PRIMARY KEY (`id_mensaje`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conversaciones_chatbot` ADD CONSTRAINT `conversaciones_chatbot_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;