CREATE TABLE `card_game`.`s_robot` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `forTyp` VARCHAR(45) NOT NULL,
  `uid` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `index2` (`forTyp` ASC));
