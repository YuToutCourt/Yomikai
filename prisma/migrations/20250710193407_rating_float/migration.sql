-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `userlogo` VARCHAR(255) NULL,
    `isadmin` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Manga` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `author` VARCHAR(100) NULL,
    `genre` VARCHAR(100) NULL,
    `coverImage` VARCHAR(255) NULL,
    `publication_year` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tome` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER NOT NULL,
    `prix` DECIMAL(15, 2) NOT NULL,
    `editeur` VARCHAR(50) NOT NULL,
    `coverImage` VARCHAR(255) NULL,
    `mangaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reading` (
    `userId` INTEGER NOT NULL,
    `tomeId` INTEGER NOT NULL,
    `rating` INTEGER NULL,

    PRIMARY KEY (`userId`, `tomeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tome` ADD CONSTRAINT `Tome_mangaId_fkey` FOREIGN KEY (`mangaId`) REFERENCES `Manga`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reading` ADD CONSTRAINT `Reading_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reading` ADD CONSTRAINT `Reading_tomeId_fkey` FOREIGN KEY (`tomeId`) REFERENCES `Tome`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
