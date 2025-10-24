CREATE DATABASE IF NOT EXISTS AUSWO;

USE AUSWO;

CREATE TABLE IF NOT EXISTS Users (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(35),
    lastName VARCHAR(35),
    phoneNumber VARCHAR(15) UNIQUE,
    email VARCHAR(28) UNIQUE,
    userName VARCHAR(50) UNIQUE,
    passwordHash VARCHAR(255),
    visaOption VARCHAR(128),
    visaPoints INT
);

-- Added API Login support (Should work based on previous Web and Database assignment but we'll see)
CREATE TABLE IF NOT EXISTS LoginProviders (
    providerID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    providerName VARCHAR(50),
    providerUID VARCHAR(50),
    accessToken VARCHAR(255),
    refreshToken VARCHAR(255),
    expiresAt DATETIME,
    FOREIGN KEY (userID) REFERENCES Users(userID),
    UNIQUE(providerName, providerUID)
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
    UNIQUE(userID, roleID)
);

CREATE TABLE IF NOT EXISTS QuickNews (
    newsID INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    datePublished DATETIME DEFAULT CURRENT_TIMESTAMP,
    authorID INT NULL,
    FOREIGN KEY (authorID) REFERENCES Users(userID) ON DELETE SET NULL
);

-- Occupation List Types (MLTSSL, STSOL, ROL)
CREATE TABLE IF NOT EXISTS OccupationLists (
    listID INT PRIMARY KEY AUTO_INCREMENT,
    listName ENUM('MLTSSL', 'STSOL', 'ROL') UNIQUE
);

-- Occupations linked to one of the lists
CREATE TABLE IF NOT EXISTS Occupations (
    anzsco INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    authority VARCHAR(255),
    skillLevel INT,
    listID INT,
    FOREIGN KEY (listID) REFERENCES OccupationLists(listID)
);

-- Insert the three lists
INSERT IGNORE INTO OccupationLists (listName) VALUES ('MLTSSL'), ('STSOL'), ('ROL');

-- Web Scraper Table
CREATE TABLE IF NOT EXISTS ScrapedOccupations (
    scrapeID INT PRIMARY KEY AUTO_INCREMENT,
    JobTitle VARCHAR(255),
    CorporateName VARCHAR(255),
    PositionType VARCHAR(100),
    Location VARCHAR(255),
    JobDescription TEXT,
    DateScraped DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS ContactMessages (
    messageID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT NULL,
    topic VARCHAR(50),
    messageBody TEXT,
    dateSent DATETIME DEFAULT CURRENT_TIMESTAMP,
    guestfirstName VARCHAR(50) NULL,
    guestlastName VARCHAR(50) NULL,
    guestEmail VARCHAR(100) NULL,
    FOREIGN KEY (userID) REFERENCES Users(userID)
);


