-- CreateTable
CREATE TABLE `usuarios` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `correo` VARCHAR(150) NOT NULL,
    `contrasena_hash` VARCHAR(255) NOT NULL,
    `tipo_usuario` ENUM('candidato', 'empresa', 'admin', 'mentor') NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidatos` (
    `id_candidato` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `ubicacion` VARCHAR(150) NULL,
    `resumen_perfil` TEXT NULL,
    `tipo_discapacidad` VARCHAR(100) NULL,
    `visible_discapacidad` BOOLEAN NOT NULL DEFAULT false,
    `cv_url` VARCHAR(255) NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `candidatos_id_usuario_key`(`id_usuario`),
    INDEX `candidatos_ubicacion_idx`(`ubicacion`),
    PRIMARY KEY (`id_candidato`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresas` (
    `id_empresa` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `nombre_empresa` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `sitio_web` VARCHAR(255) NULL,
    `ubicacion` VARCHAR(150) NULL,
    `logo_url` VARCHAR(255) NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `empresas_id_usuario_key`(`id_usuario`),
    PRIMARY KEY (`id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sello_inclusion` (
    `id_sello` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `nivel` ENUM('basico', 'intermedio', 'avanzado') NOT NULL,
    `fecha_verificacion` TIMESTAMP(0) NULL,
    `verificado_por` INTEGER NULL,
    `evidencia_url` VARCHAR(255) NULL,
    `estado` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',

    UNIQUE INDEX `sello_inclusion_id_empresa_key`(`id_empresa`),
    PRIMARY KEY (`id_sello`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `habilidades` (
    `id_habilidad` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_habilidad` VARCHAR(100) NOT NULL,
    `categoria` VARCHAR(50) NULL,

    UNIQUE INDEX `habilidades_nombre_habilidad_key`(`nombre_habilidad`),
    PRIMARY KEY (`id_habilidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `habilidades_candidato` (
    `id_candidato` INTEGER NOT NULL,
    `id_habilidad` INTEGER NOT NULL,
    `nivel` ENUM('basico', 'intermedio', 'avanzado') NOT NULL,

    PRIMARY KEY (`id_candidato`, `id_habilidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipos_ajuste` (
    `id_ajuste` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_ajuste` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,

    PRIMARY KEY (`id_ajuste`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ajustes_candidato` (
    `id_candidato` INTEGER NOT NULL,
    `id_ajuste` INTEGER NOT NULL,

    PRIMARY KEY (`id_candidato`, `id_ajuste`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vacantes` (
    `id_vacante` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `modalidad` ENUM('presencial', 'remoto', 'hibrido') NOT NULL,
    `salario_min` DECIMAL(10, 2) NULL,
    `salario_max` DECIMAL(10, 2) NULL,
    `fecha_publicacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_cierre` TIMESTAMP(0) NULL,
    `estado` ENUM('activa', 'cerrada', 'en_revision') NOT NULL DEFAULT 'activa',
    `alerta_lenguaje` BOOLEAN NOT NULL DEFAULT false,

    INDEX `vacantes_estado_idx`(`estado`),
    FULLTEXT INDEX `vacantes_titulo_descripcion_idx`(`titulo`, `descripcion`),
    PRIMARY KEY (`id_vacante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ajustes_vacante` (
    `id_vacante` INTEGER NOT NULL,
    `id_ajuste` INTEGER NOT NULL,

    PRIMARY KEY (`id_vacante`, `id_ajuste`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postulaciones` (
    `id_postulacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_candidato` INTEGER NOT NULL,
    `id_vacante` INTEGER NOT NULL,
    `puntaje_match` DECIMAL(5, 2) NULL,
    `estado` ENUM('enviada', 'en_revision', 'entrevista', 'rechazada', 'contratada') NOT NULL DEFAULT 'enviada',
    `fecha_postulacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `postulaciones_id_candidato_idx`(`id_candidato`),
    INDEX `postulaciones_id_vacante_idx`(`id_vacante`),
    UNIQUE INDEX `postulaciones_id_candidato_id_vacante_key`(`id_candidato`, `id_vacante`),
    PRIMARY KEY (`id_postulacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resenas` (
    `id_resena` INTEGER NOT NULL AUTO_INCREMENT,
    `id_candidato` INTEGER NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `calificacion` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `fecha_resena` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `moderada` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id_resena`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mentores` (
    `id_mentor` INTEGER NOT NULL AUTO_INCREMENT,
    `id_candidato` INTEGER NOT NULL,
    `biografia` TEXT NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `mentores_id_candidato_key`(`id_candidato`),
    PRIMARY KEY (`id_mentor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mentorias` (
    `id_mentoria` INTEGER NOT NULL AUTO_INCREMENT,
    `id_mentor` INTEGER NOT NULL,
    `id_candidato` INTEGER NOT NULL,
    `fecha_sesion` TIMESTAMP(0) NULL,
    `notas` TEXT NULL,

    PRIMARY KEY (`id_mentoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_hash` VARCHAR(255) NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL DEFAULT 'refresh',
    `expira_en` TIMESTAMP(0) NOT NULL,
    `revocado_en` TIMESTAMP(0) NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_id_usuario_idx`(`id_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `candidatos` ADD CONSTRAINT `candidatos_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresas` ADD CONSTRAINT `empresas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sello_inclusion` ADD CONSTRAINT `sello_inclusion_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sello_inclusion` ADD CONSTRAINT `sello_inclusion_verificado_por_fkey` FOREIGN KEY (`verificado_por`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `habilidades_candidato` ADD CONSTRAINT `habilidades_candidato_id_candidato_fkey` FOREIGN KEY (`id_candidato`) REFERENCES `candidatos`(`id_candidato`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `habilidades_candidato` ADD CONSTRAINT `habilidades_candidato_id_habilidad_fkey` FOREIGN KEY (`id_habilidad`) REFERENCES `habilidades`(`id_habilidad`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ajustes_candidato` ADD CONSTRAINT `ajustes_candidato_id_candidato_fkey` FOREIGN KEY (`id_candidato`) REFERENCES `candidatos`(`id_candidato`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ajustes_candidato` ADD CONSTRAINT `ajustes_candidato_id_ajuste_fkey` FOREIGN KEY (`id_ajuste`) REFERENCES `tipos_ajuste`(`id_ajuste`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vacantes` ADD CONSTRAINT `vacantes_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ajustes_vacante` ADD CONSTRAINT `ajustes_vacante_id_vacante_fkey` FOREIGN KEY (`id_vacante`) REFERENCES `vacantes`(`id_vacante`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ajustes_vacante` ADD CONSTRAINT `ajustes_vacante_id_ajuste_fkey` FOREIGN KEY (`id_ajuste`) REFERENCES `tipos_ajuste`(`id_ajuste`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postulaciones` ADD CONSTRAINT `postulaciones_id_candidato_fkey` FOREIGN KEY (`id_candidato`) REFERENCES `candidatos`(`id_candidato`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postulaciones` ADD CONSTRAINT `postulaciones_id_vacante_fkey` FOREIGN KEY (`id_vacante`) REFERENCES `vacantes`(`id_vacante`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas` ADD CONSTRAINT `resenas_id_candidato_fkey` FOREIGN KEY (`id_candidato`) REFERENCES `candidatos`(`id_candidato`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas` ADD CONSTRAINT `resenas_id_empresa_fkey` FOREIGN KEY (`id_empresa`) REFERENCES `empresas`(`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mentores` ADD CONSTRAINT `mentores_id_candidato_fkey` FOREIGN KEY (`id_candidato`) REFERENCES `candidatos`(`id_candidato`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mentorias` ADD CONSTRAINT `mentorias_id_mentor_fkey` FOREIGN KEY (`id_mentor`) REFERENCES `mentores`(`id_mentor`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mentorias` ADD CONSTRAINT `mentorias_id_candidato_fkey` FOREIGN KEY (`id_candidato`) REFERENCES `candidatos`(`id_candidato`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;
