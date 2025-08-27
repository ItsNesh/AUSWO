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
