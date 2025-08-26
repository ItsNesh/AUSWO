CREATE DATABASE IF NOT EXISTS AUSWO;

USE AUSWO;

CREATE TABLE IF NOT EXISTS Users (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(35),
    lastName VARCHAR(35),
    phoneNumber VARCHAR(15) UNIQUE,
    email VARCHAR(28) UNIQUE,
    userName VARCHAR(50) UNIQUE,
    passwordHash VARCHAR(255) 
);

CREATE TABLE IF NOT EXISTS Roles (
    roleID INT PRIMARY KEY AUTO_INCREMENT,
    roleName VARCHAR(255),
    roleAbilities JSON
);

CREATE TABLE IF NOT EXISTS UserRoles (
    userRoleID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    roleID int,
    FOREIGN KEY (userID) REFERENCES Users(userID),
    FOREIGN KEY (roleID) REFERENCES Roles(roleID),
    UNIQUE(userID, roleID).
);

CREATE TABLE IF NOT EXISTS QuickNews (
    newsID INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    datePublished DATETIME DEFAULT CURRENT_TIMESTAMP,
    authorID INT NOT NULL,
    FOREIGN KEY (authorID) REFERENCES Users(userID)
);