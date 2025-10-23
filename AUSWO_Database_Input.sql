USE AUSWO;

--INSERT INTO Users (firstName, lastName, phoneNumber, email, userName, passwordHash)
--VALUES 
--('Alice', 'Smith', '0412000001', 'alice@example.com', 'alice_smith', ''), --
--('Bob', 'Johnson', '0412000002', 'bob@example.com', 'bob_j', ''), --
--('Charlie', 'Brown', '0412000003', 'charlie@example.com', 'charlie_b', ''); --

INSERT INTO Roles (roleName, roleAbilities)
VALUES
('Admin', '{"can_post_news": true, "can_manage_users": true}'),
('User', '{"can_post_news": false, "can_manage_users": false}');

-- INSERT INTO UserRoles (userID, roleID)
-- VALUES
-- (1, 1),  -- Alice -> Admin
-- (2, 2),  -- Bob -> User
-- (3, 2);  -- Charlie -> User

INSERT INTO QuickNews (title, body, authorID)
VALUES
('Server Maintenance Tonight', 'The system will be down for maintenance tonight from 10 PM to 12 AM.', NULL),
('New Feature Released', 'We have launched the new dashboard feature for all users.', NULL);

INSERT INTO Occupations (anzsco, name, authority, skillLevel, listID) VALUES 
(254422, 'Registered Nurse (Mental Health)', 'VETASSESS', 1, (SELECT listID FROM OccupationLists WHERE listName = 'MLTSSL')),
(254423, 'Registered Nurse (Perioperative)', 'EAVIML', 1, (SELECT listID FROM OccupationLists WHERE listName = 'MLTSSL')),
(254424, 'Registered Nurse (Surgical)', 'ACECQA', 1, (SELECT listID FROM OccupationLists WHERE listName = 'MLTSSL')),
(254425, 'Registered Nurse (Paediatrics)', 'ANMAC', 1, (SELECT listID FROM OccupationLists WHERE listName = 'MLTSSL')),
(254499, 'Registered Nurses nec', 'VETASSESS', 1, (SELECT listID FROM OccupationLists WHERE listName = 'MLTSSL'));

INSERT INTO Occupations (anzsco, name, authority, skillLevel, listID) VALUES 
(234711, 'Veterinarian', 'TRA', 2, (SELECT listID FROM OccupationLists WHERE listName = 'STSOL')),
(234911, 'Conservator', 'VETASSESS', 3, (SELECT listID FROM OccupationLists WHERE listName = 'STSOL')),
(234912, 'Metallurgist', 'ANMAC', 2, (SELECT listID FROM OccupationLists WHERE listName = 'STSOL')),
(234913, 'Meteorologist', 'VETASSESS', 2, (SELECT listID FROM OccupationLists WHERE listName = 'STSOL')),
(234914, 'Physicist', 'ACWA', 2, (SELECT listID FROM OccupationLists WHERE listName = 'STSOL'));

INSERT INTO Occupations (anzsco, name, authority, skillLevel, listID) VALUES
(249311, 'Teacher of English to Speakers of Other Languages', 'ADC', 1, (SELECT listID FROM OccupationLists WHERE listName = 'ROL')),
(251111, 'Dietitian', 'AIMS', 3, (SELECT listID FROM OccupationLists WHERE listName = 'ROL')),
(251112, 'Nutritionist', 'AMSA', 2, (SELECT listID FROM OccupationLists WHERE listName = 'ROL')),
(251211, 'Medical Diagnostic Radiographer', 'CASA', 1, (SELECT listID FROM OccupationLists WHERE listName = 'ROL')),
(251212, 'Medical Radiation Therapist', 'CASA', 1, (SELECT listID FROM OccupationLists WHERE listName = 'ROL'));

INSERT INTO ScrapedOccupations (JobTitle, CorporateName, PositionType, Location, JobDescription) VALUES
('Software Engineer', 'TechSolutions Pty Ltd', 'Full-time', 'Sydney, NSW', 'Develop and maintain web applications using modern frameworks. Open to skilled foreign applicants.'),
('Chef', 'Gourmet Eats', 'Full-time', 'Melbourne, VIC', 'Experienced chefs needed for fine dining. Visa sponsorship available.'),
('English Teacher', 'Global Language Institute', 'Part-time', 'Brisbane, QLD', 'Teach English to non-native speakers. TESOL certification preferred.'),
('Civil Engineer', 'BuildCorp', 'Contract', 'Perth, WA', 'Manage construction projects and ensure compliance with safety standards.'),
('Registered Nurse', 'HealthFirst Hospital', 'Full-time', 'Adelaide, SA', 'Provide nursing care in a hospital setting. Registration with AHPRA required.'),
('Data Analyst', 'DataWave Analytics', 'Full-time', 'Sydney, NSW', 'Analyze business data to produce actionable insights. SQL and Python skills required.'),
('Marketing Coordinator', 'Bright Ideas Agency', 'Full-time', 'Melbourne, VIC', 'Coordinate marketing campaigns and social media strategy.'),
('Construction Project Manager', 'Urban Builders', 'Full-time', 'Brisbane, QLD', 'Oversee construction projects, budgets, and timelines.'),
('Barista', 'Coffee Culture', 'Part-time', 'Sydney, NSW', 'Prepare coffee and provide excellent customer service. Experience preferred.'),
('Plumber', 'Rapid Plumbing Services', 'Full-time', 'Perth, WA', 'Install and repair plumbing systems. License preferred.'),
('UX/UI Designer', 'Creative Minds', 'Contract', 'Melbourne, VIC', 'Design user interfaces and improve user experience for web and mobile apps.'),
('Mechanical Engineer', 'AutoTech Engineering', 'Full-time', 'Adelaide, SA', 'Design and maintain mechanical systems in manufacturing.'),
('Accountant', 'Numbers & Co.', 'Full-time', 'Sydney, NSW', 'Prepare financial statements and manage accounts. CPA preferred.'),
('Hotel Receptionist', 'Sunrise Hotels', 'Full-time', 'Gold Coast, QLD', 'Manage front desk, bookings, and customer inquiries. Experience preferred.'),
('Warehouse Operator', 'LogiTech', 'Full-time', 'Melbourne, VIC', 'Manage inventory, loading, and shipping operations in a warehouse.');

