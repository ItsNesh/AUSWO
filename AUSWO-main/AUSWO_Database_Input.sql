USE AUSWO;

INSERT INTO Users (firstName, lastName, phoneNumber, email, userName, passwordHash)
VALUES 
('Alice', 'Smith', '0412000001', 'alice@example.com', 'alice_smith', 'hashed_password1'),
('Bob', 'Johnson', '0412000002', 'bob@example.com', 'bob_j', 'hashed_password2'),
('Charlie', 'Brown', '0412000003', 'charlie@example.com', 'charlie_b', 'hashed_password3');

INSERT INTO Roles (roleName, roleAbilities)
VALUES
('Admin', '{"can_post_news": true, "can_manage_users": true}'),
('User', '{"can_post_news": false, "can_manage_users": false}');

INSERT INTO UserRoles (userID, roleID)
VALUES
(1, 1),  -- Alice -> Admin
(2, 2),  -- Bob -> User
(3, 2);  -- Charlie -> User

INSERT INTO QuickNews (title, body, authorID)
VALUES
('Server Maintenance Tonight', 'The system will be down for maintenance tonight from 10 PM to 12 AM.', 1),
('New Feature Released', 'We have launched the new dashboard feature for all users.', 1);

INSERT INTO Occupations (anzsco, name, authority, skillLevel, listID)
VALUES (254422, 'Registered Nurse (Mental Health)', 'VETASSESS', 1, 
(SELECT listID FROM OccupationLists WHERE listName = 'MLTSSL'));

INSERT INTO Occupations (anzsco, name, authority, skillLevel, listID)
VALUES (234711, 'Veterinarian', 'TRA', 2, 
(SELECT listID FROM OccupationLists WHERE listName = 'STSOL'));

INSERT INTO Occupations (anzsco, name, authority, skillLevel, listID)
VALUES (249311, 'Teacher of English to Speakers of Other Languages', 'ADC', 1, 
(SELECT listID FROM OccupationLists WHERE listName = 'ROL'));

INSERT INTO Pages (pageName, pageTitle, pageContent)
VALUES 
('home', 'Welcome to AUSWO', 'This is the homepage content...'),
('about', 'About Us', 'This page describes the company and mission...'),
('occupation_list', 'Occupation List', 'This page contains the lists of occupations...');
