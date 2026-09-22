-- =============================================================================
-- AGRIVISTA 3.0 COMPLETE DATABASE SEED SCRIPT
-- Munisipalidad ng Polomolok, Timog Cotabato
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. RSBSA FARMER RECORDS (23 Magsasaka para sa 23 Barangay)
-- -----------------------------------------------------------------------------
INSERT INTO "Farmer" (
    "id", "rsbsaNumber", "farmerCode", "firstName", "middleName", "lastName", "extensionName",
    "sex", "dateOfBirth", "contactNumber", "email", "barangay", "municipality", "province",
    "civilStatus", "isSenior", "isPwd", "is4ps", "isIp", "status"
) VALUES
(1, '12-63-12-001-000101', 'FAR-PLK-001', 'Juan', 'dela Cruz', 'Magbanua', NULL, 'Male', '1968-04-12', '09171012345', 'j.magbanua@gmail.com', 'Bentung', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(2, '12-63-12-002-000102', 'FAR-PLK-002', 'Maria', 'Santos', 'Villanueva', NULL, 'Female', '1974-09-23', '09182023456', 'm.villanueva@yahoo.com', 'Cannery Site', 'Polomolok', 'South Cotabato', 'Married', false, false, true, false, 'Active'),
(3, '12-63-12-003-000103', 'FAR-PLK-003', 'Danilo', 'Perez', 'Alcantara', 'Jr.', 'Male', '1959-11-05', '09203034567', NULL, 'Crossing Palkan', 'Polomolok', 'South Cotabato', 'Widowed', true, false, false, false, 'Active'),
(4, '12-63-12-004-000104', 'FAR-PLK-004', 'Eduardo', 'Gomez', 'Cariño', NULL, 'Male', '1982-01-18', '09224045678', 'e.carino@outlook.com', 'Glamang', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(5, '12-63-12-005-000105', 'FAR-PLK-005', 'Blaan', 'Fulong', 'Tamfungan', NULL, 'Male', '1963-07-30', '09355056789', NULL, 'Kinilis', 'Polomolok', 'South Cotabato', 'Married', true, false, true, true, 'Active'),
(6, '12-63-12-006-000106', 'FAR-PLK-006', 'Roberto', 'Navarro', 'Castillo', NULL, 'Male', '1971-03-14', '09466067890', 'r.castillo@gmail.com', 'Klinan 6', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(7, '12-63-12-007-000107', 'FAR-PLK-007', 'Salvador', 'Lim', 'Tan', NULL, 'Male', '1979-12-01', '09507078901', 's.tan@gmail.com', 'Koronadal Proper', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(8, '12-63-12-008-000108', 'FAR-PLK-008', 'Elena', 'Bautista', 'Morales', NULL, 'Female', '1985-05-19', '09618089012', 'elena.morales@yahoo.com', 'Lam-Caliaf', 'Polomolok', 'South Cotabato', 'Single', false, false, false, false, 'Active'),
(9, '12-63-12-009-000109', 'FAR-PLK-009', 'Melchor', 'Datu', 'Salway', NULL, 'Male', '1960-08-25', '09759090123', NULL, 'Landan', 'Polomolok', 'South Cotabato', 'Married', true, false, true, true, 'Active'),
(10, '12-63-12-010-000110', 'FAR-PLK-010', 'Arlene', 'Quirino', 'Mercado', NULL, 'Female', '1990-02-11', '09810101234', 'a.mercado@gmail.com', 'Lapu', 'Polomolok', 'South Cotabato', 'Married', false, true, false, false, 'Active'),
(11, '12-63-12-011-000111', 'FAR-PLK-011', 'Nestor', 'Flores', 'Abad', NULL, 'Male', '1976-10-08', '09951112345', 'n.abad@gmail.com', 'Lumakil', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(12, '12-63-12-012-000112', 'FAR-PLK-012', 'Rogelio', 'Reyes', 'Torres', 'Sr.', 'Male', '1958-06-15', '09122223456', NULL, 'Magsaysay', 'Polomolok', 'South Cotabato', 'Married', true, false, false, false, 'Active'),
(13, '12-63-12-013-000113', 'FAR-PLK-013', 'Solomon', 'Lumilis', 'Kafan', NULL, 'Male', '1965-03-22', '09233334567', NULL, 'Maligo', 'Polomolok', 'South Cotabato', 'Married', false, false, true, true, 'Active'),
(14, '12-63-12-014-000114', 'FAR-PLK-014', 'Priscilla', 'Soriano', 'Aguilar', NULL, 'Female', '1981-11-29', '09344445678', 'p.aguilar@gmail.com', 'Pagalungan', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(15, '12-63-12-015-000115', 'FAR-PLK-015', 'Domingo', 'Ortega', 'Valdez', NULL, 'Male', '1973-04-03', '09455556789', 'd.valdez@gmail.com', 'Palkan', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(16, '12-63-12-016-000116', 'FAR-PLK-016', 'Felipe', 'Santiago', 'Cordero', NULL, 'Male', '1969-09-17', '09566667890', 'f.cordero@gmail.com', 'Poblacion', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(17, '12-63-12-017-000117', 'FAR-PLK-017', 'Cesar', 'Mendoza', 'Pascua', NULL, 'Male', '1978-12-25', '09677778901', 'c.pascua@gmail.com', 'Polo', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(18, '12-63-12-018-000118', 'FAR-PLK-018', 'Lourdes', 'Estrella', 'Corpuz', NULL, 'Female', '1987-01-05', '09788889012', 'l.corpuz@gmail.com', 'Rubber', 'Polomolok', 'South Cotabato', 'Single', false, false, false, false, 'Active'),
(19, '12-63-12-019-000119', 'FAR-PLK-019', 'Ramon', 'Aquino', 'Fernandez', NULL, 'Male', '1972-05-14', '09899990123', 'r.fernandez@gmail.com', 'Silway 7', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(20, '12-63-12-020-000120', 'FAR-PLK-020', 'Arnulfo', 'Magsaysay', 'Suarez', NULL, 'Male', '1961-02-28', '09101234567', 'a.suarez@gmail.com', 'Silway 8', 'Polomolok', 'South Cotabato', 'Married', true, false, false, false, 'Active'),
(21, '12-63-12-021-000121', 'FAR-PLK-021', 'Generoso', 'Padilla', 'Ledesma', NULL, 'Male', '1983-08-16', '09212345678', 'g.ledesma@gmail.com', 'Sulit', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active'),
(22, '12-63-12-022-000122', 'FAR-PLK-022', 'Teresa', 'Galang', 'Ocampo', NULL, 'Female', '1980-06-20', '09323456789', 't.ocampo@gmail.com', 'Sumbakil', 'Polomolok', 'South Cotabato', 'Widowed', false, false, true, false, 'Active'),
(23, '12-63-12-023-000123', 'FAR-PLK-023', 'Bienvenido', 'Alvarez', 'Miranda', NULL, 'Male', '1970-12-09', '09434567890', 'b.miranda@gmail.com', 'Upper Klinan', 'Polomolok', 'South Cotabato', 'Married', false, false, false, false, 'Active')
ON CONFLICT ("rsbsaNumber") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Farmer"', 'id'), 23);

-- -----------------------------------------------------------------------------
-- 2. FARM LANDHOLDINGS (23 Sakahan)
-- -----------------------------------------------------------------------------
INSERT INTO "Farm" (
    "id", "farmerId", "farmCode", "farmName", "barangay", "municipality", "province",
    "sitioPurok", "latitude", "longitude", "totalAreaHa", "tenureType", "soilType",
    "waterSource", "isCalamityAffected", "status", "remarks"
) VALUES
(1, 1, 'FRM-PLK-001', 'Magbanua Corn Farm', 'Bentung', 'Polomolok', 'South Cotabato', 'Purok 2', 6.2082, 125.0125, 2.50, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Patag na lupain, angkop sa hybrid corn'),
(2, 2, 'FRM-PLK-002', 'Villanueva Agro Farm', 'Cannery Site', 'Polomolok', 'South Cotabato', 'Purok Malipayon', 6.2355, 125.0801, 1.80, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Malapit sa plantasyon ng pinya'),
(3, 3, 'FRM-PLK-003', 'Alcantara Diversified Farm', 'Crossing Palkan', 'Polomolok', 'South Cotabato', 'Purok 1', 6.2621, 125.0504, 3.00, 'Owned', 'Sandy Loam', 'Rainfed', false, 'Active', 'Banayad na dalisdis sa paanan ng burol'),
(4, 4, 'FRM-PLK-004', 'Cariño Grain Field', 'Glamang', 'Polomolok', 'South Cotabato', 'Purok Katipunan', 6.1625, 125.0839, 4.20, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Pangunahing taniman ng mais'),
(5, 5, 'FRM-PLK-005', 'Tamfungan Ancestral Orchard', 'Kinilis', 'Polomolok', 'South Cotabato', 'Sitio 8', 6.2950, 125.1105, 2.20, 'Owned', 'Sandy Loam', 'Spring/Creek', false, 'Active', 'Matutum protected slope agroforestry'),
(6, 6, 'FRM-PLK-006', 'Castillo Rice & Corn Farm', 'Klinan 6', 'Polomolok', 'South Cotabato', 'Purok Pag-asa', 6.2104, 125.1152, 3.50, 'Owned', 'Clay Loam', 'Irrigated', false, 'Active', 'May supply ng tubig-irigasyon'),
(7, 7, 'FRM-PLK-007', 'Tan Commercial Field', 'Koronadal Proper', 'Polomolok', 'South Cotabato', 'Purok San Jose', 6.2280, 124.9950, 2.80, 'Tenanted', 'Clay Loam', 'Rainfed', false, 'Active', 'Nakahalo ang mais at kamoteng-kahoy'),
(8, 8, 'FRM-PLK-008', 'Morales Homestead Farm', 'Lam-Caliaf', 'Polomolok', 'South Cotabato', 'Purok Centro', 6.2320, 125.0482, 1.50, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Rainfed subsistence farming'),
(9, 9, 'FRM-PLK-009', 'Salway Agro-Eco Plot', 'Landan', 'Polomolok', 'South Cotabato', 'Purok Bukay Eel', 6.3102, 125.1432, 2.60, 'Owned', 'Sandy Loam', 'Spring/Creek', false, 'Active', 'Kape at saging intercropping'),
(10, 10, 'FRM-PLK-010', 'Mercado Asparagus Lot', 'Lapu', 'Polomolok', 'South Cotabato', 'Purok 3', 6.2485, 125.0150, 1.75, 'Leased', 'Clay Loam', 'Shallow Tube Well', false, 'Active', 'Commercial asparagus plot'),
(11, 11, 'FRM-PLK-011', 'Abad Family Farm', 'Lumakil', 'Polomolok', 'South Cotabato', 'Purok Riverside', 6.2052, 125.0351, 2.10, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'High yield corn production'),
(12, 12, 'FRM-PLK-012', 'Torres Green Plains', 'Magsaysay', 'Polomolok', 'South Cotabato', 'Purok Bonifacio', 6.2180, 125.0550, 2.40, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Maisan at gulayan'),
(13, 13, 'FRM-PLK-013', 'Kafan High-Altitude Plot', 'Maligo', 'Polomolok', 'South Cotabato', 'Sitio Kawit', 6.3250, 125.1502, 3.20, 'Owned', 'Sandy Loam', 'Natural Springs', false, 'Active', 'Matutum highland specialty coffee'),
(14, 14, 'FRM-PLK-014', 'Aguilar Vegetable Field', 'Pagalungan', 'Polomolok', 'South Cotabato', 'Purok San Roque', 6.2381, 125.0280, 1.90, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'High-value crop area'),
(15, 15, 'FRM-PLK-015', 'Valdez Upland Parcel', 'Palkan', 'Polomolok', 'South Cotabato', 'Purok Maharlika', 6.2805, 125.0754, 2.70, 'Owned', 'Sandy Loam', 'Rainfed', false, 'Active', 'Upland corn and fruit trees'),
(16, 16, 'FRM-PLK-016', 'Cordero Model Agri Farm', 'Poblacion', 'Polomolok', 'South Cotabato', 'Purok 4', 6.2196, 125.0693, 1.20, 'Owned', 'Clay Loam', 'Irrigated', false, 'Active', 'Intensive rice farming'),
(17, 17, 'FRM-PLK-017', 'Pascua Plantation Holding', 'Polo', 'Polomolok', 'South Cotabato', 'Purok Bayanihan', 6.2650, 125.0921, 3.80, 'Owned', 'Sandy Loam', 'Rainfed', false, 'Active', 'Komersyal na maisan'),
(18, 18, 'FRM-PLK-018', 'Corpuz Industrial Agro', 'Rubber', 'Polomolok', 'South Cotabato', 'Purok Magsaysay', 6.2401, 125.0025, 2.00, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Agro-industrial crop zone'),
(19, 19, 'FRM-PLK-019', 'Fernandez Riverfront Farm', 'Silway 7', 'Polomolok', 'South Cotabato', 'Purok Daisy', 6.1765, 125.1190, 3.00, 'Owned', 'Clay Loam', 'Irrigated', false, 'Active', 'Irrigated hybrid rice paddy'),
(20, 20, 'FRM-PLK-020', 'Suarez Rice & Corn Estate', 'Silway 8', 'Polomolok', 'South Cotabato', 'Purok Upper Matin-ao', 6.1938, 125.0853, 4.50, 'Owned', 'Clay Loam', 'Irrigated', true, 'Active', 'Apektado ng El Niño drought noong Abril 2024'),
(21, 21, 'FRM-PLK-021', 'Ledesma Export Crops', 'Sulit', 'Polomolok', 'South Cotabato', 'Purok 5', 6.2301, 125.0182, 2.30, 'Owned', 'Clay Loam', 'Rainfed', false, 'Active', 'Asparagus export cluster'),
(22, 22, 'FRM-PLK-022', 'Ocampo Highlands Plot', 'Sumbakil', 'Polomolok', 'South Cotabato', 'Purok Bagong Silang', 6.2550, 125.0080, 1.80, 'Tenanted', 'Clay Loam', 'Rainfed', false, 'Active', 'Asparagus at mais'),
(23, 23, 'FRM-PLK-023', 'Miranda Pioneer Farm', 'Upper Klinan', 'Polomolok', 'South Cotabato', 'Purok Rosal', 6.2250, 125.1050, 3.60, 'Owned', 'Clay Loam', 'Irrigated', false, 'Active', 'Rice-corn cropping pattern')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Farm"', 'id'), 23);

-- -----------------------------------------------------------------------------
-- 3. FARM PARCELS (23 Georeferenced Plots)
-- -----------------------------------------------------------------------------
INSERT INTO "FarmParcel" (
    "id", "farmId", "parcelNumber", "parcelCode", "latitude", "longitude",
    "areaHa", "soilType", "boundaryCoordinates", "remarks", "status"
) VALUES
(1, 1, 'P-01', 'PCL-PLK-001', 6.2082, 125.0125, 2.50, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0120, 6.2080], [125.0130, 6.2080], [125.0130, 6.2085], [125.0120, 6.2085], [125.0120, 6.2080]]]}', 'Plot A1 Corn', 'Active'),
(2, 2, 'P-01', 'PCL-PLK-002', 6.2355, 125.0801, 1.80, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0795, 6.2350], [125.0805, 6.2350], [125.0805, 6.2358], [125.0795, 6.2358], [125.0795, 6.2350]]]}', 'Plot B1 Pineapple', 'Active'),
(3, 3, 'P-01', 'PCL-PLK-003', 6.2621, 125.0504, 3.00, 'Sandy Loam', '{"type": "Polygon", "coordinates": [[[125.0500, 6.2618], [125.0512, 6.2618], [125.0512, 6.2625], [125.0500, 6.2625], [125.0500, 6.2618]]]}', 'Plot C1 Yellow Corn', 'Active'),
(4, 4, 'P-01', 'PCL-PLK-004', 6.1625, 125.0839, 4.20, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0830, 6.1620], [125.0845, 6.1620], [125.0845, 6.1630], [125.0830, 6.1630], [125.0830, 6.1620]]]}', 'Plot D1 Hybrid Corn', 'Active'),
(5, 5, 'P-01', 'PCL-PLK-005', 6.2950, 125.1105, 2.20, 'Sandy Loam', '{"type": "Polygon", "coordinates": [[[125.1100, 6.2945], [125.1110, 6.2945], [125.1110, 6.2955], [125.1100, 6.2955], [125.1100, 6.2945]]]}', 'Plot E1 Arabica Coffee', 'Active'),
(6, 6, 'P-01', 'PCL-PLK-006', 6.2104, 125.1152, 3.50, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.1145, 6.2100], [125.1160, 6.2100], [125.1160, 6.2110], [125.1145, 6.2110], [125.1145, 6.2100]]]}', 'Plot F1 Irrigated Rice', 'Active'),
(7, 7, 'P-01', 'PCL-PLK-007', 6.2280, 124.9950, 2.80, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[124.9945, 6.2275], [124.9955, 6.2275], [124.9955, 6.2285], [124.9945, 6.2285], [124.9945, 6.2275]]]}', 'Plot G1 Corn', 'Active'),
(8, 8, 'P-01', 'PCL-PLK-008', 6.2320, 125.0482, 1.50, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0475, 6.2315], [125.0485, 6.2315], [125.0485, 6.2325], [125.0475, 6.2325], [125.0475, 6.2315]]]}', 'Plot H1 White Corn', 'Active'),
(9, 9, 'P-01', 'PCL-PLK-009', 6.3102, 125.1432, 2.60, 'Sandy Loam', '{"type": "Polygon", "coordinates": [[[125.1425, 6.3095], [125.1438, 6.3095], [125.1438, 6.3108], [125.1425, 6.3108], [125.1425, 6.3095]]]}', 'Plot I1 Robusta Coffee', 'Active'),
(10, 10, 'P-01', 'PCL-PLK-010', 6.2485, 125.0150, 1.75, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0145, 6.2480], [125.0155, 6.2480], [125.0155, 6.2490], [125.0145, 6.2490], [125.0145, 6.2480]]]}', 'Plot J1 Asparagus', 'Active'),
(11, 11, 'P-01', 'PCL-PLK-011', 6.2052, 125.0351, 2.10, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0345, 6.2048], [125.0355, 6.2048], [125.0355, 6.2058], [125.0345, 6.2058], [125.0345, 6.2048]]]}', 'Plot K1 Corn', 'Active'),
(12, 12, 'P-01', 'PCL-PLK-012', 6.2180, 125.0550, 2.40, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0545, 6.2175], [125.0555, 6.2175], [125.0555, 6.2185], [125.0545, 6.2185], [125.0545, 6.2175]]]}', 'Plot L1 Corn', 'Active'),
(13, 13, 'P-01', 'PCL-PLK-013', 6.3250, 125.1502, 3.20, 'Sandy Loam', '{"type": "Polygon", "coordinates": [[[125.1495, 6.3245], [125.1510, 6.3245], [125.1510, 6.3255], [125.1495, 6.3255], [125.1495, 6.3245]]]}', 'Plot M1 Arabica Typica', 'Active'),
(14, 14, 'P-01', 'PCL-PLK-014', 6.2381, 125.0280, 1.90, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0275, 6.2375], [125.0285, 6.2375], [125.0285, 6.2385], [125.0275, 6.2385], [125.0275, 6.2375]]]}', 'Plot N1 Asparagus', 'Active'),
(15, 15, 'P-01', 'PCL-PLK-015', 6.2805, 125.0754, 2.70, 'Sandy Loam', '{"type": "Polygon", "coordinates": [[[125.0748, 6.2800], [125.0760, 6.2800], [125.0760, 6.2810], [125.0748, 6.2810], [125.0748, 6.2800]]]}', 'Plot O1 Corn', 'Active'),
(16, 16, 'P-01', 'PCL-PLK-016', 6.2196, 125.0693, 1.20, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0688, 6.2190], [125.0698, 6.2190], [125.0698, 6.2200], [125.0688, 6.2200], [125.0688, 6.2190]]]}', 'Plot P1 Rice Paddy', 'Active'),
(17, 17, 'P-01', 'PCL-PLK-017', 6.2650, 125.0921, 3.80, 'Sandy Loam', '{"type": "Polygon", "coordinates": [[[125.0915, 6.2645], [125.0930, 6.2645], [125.0930, 6.2655], [125.0915, 6.2655], [125.0915, 6.2645]]]}', 'Plot Q1 Commercial Corn', 'Active'),
(18, 18, 'P-01', 'PCL-PLK-018', 6.2401, 125.0025, 2.00, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0020, 6.2395], [125.0030, 6.2395], [125.0030, 6.2405], [125.0020, 6.2405], [125.0020, 6.2395]]]}', 'Plot R1 Asparagus', 'Active'),
(19, 19, 'P-01', 'PCL-PLK-019', 6.1765, 125.1190, 3.00, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.1180, 6.1760], [125.1195, 6.1760], [125.1195, 6.1770], [125.1180, 6.1770], [125.1180, 6.1760]]]}', 'Plot S1 Irrigated Hybrid Rice', 'Active'),
(20, 20, 'P-01', 'PCL-PLK-020', 6.1938, 125.0853, 4.50, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0845, 6.1930], [125.0860, 6.1930], [125.0860, 6.1945], [125.0845, 6.1945], [125.0845, 6.1930]]]}', 'Plot T1 Corn/Rice Calamity Site', 'Active'),
(21, 21, 'P-01', 'PCL-PLK-021', 6.2301, 125.0182, 2.30, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0175, 6.2295], [125.0188, 6.2295], [125.0188, 6.2308], [125.0175, 6.2308], [125.0175, 6.2295]]]}', 'Plot U1 Asparagus Export', 'Active'),
(22, 22, 'P-01', 'PCL-PLK-022', 6.2550, 125.0080, 1.80, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.0075, 6.2545], [125.0085, 6.2545], [125.0085, 6.2555], [125.0075, 6.2555], [125.0075, 6.2545]]]}', 'Plot V1 Asparagus', 'Active'),
(23, 23, 'P-01', 'PCL-PLK-023', 6.2250, 125.1050, 3.60, 'Clay Loam', '{"type": "Polygon", "coordinates": [[[125.1040, 6.2245], [125.1060, 6.2245], [125.1060, 6.2258], [125.1040, 6.2258], [125.1040, 6.2245]]]}', 'Plot W1 Corn Seed Plot', 'Active')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"FarmParcel"', 'id'), 23);

-- -----------------------------------------------------------------------------
-- 4. CURRENT CROPS (23 Aktibong Pananim)
-- -----------------------------------------------------------------------------
INSERT INTO "Crop" (
    "id", "parcelId", "cropType", "variety", "category", "plantedAreaHa",
    "plantingDate", "expectedHarvestDate", "actualHarvestDate", "season", "year",
    "historicalYieldTons", "harvestedAreaHa", "productionQuantity", "productionUnit",
    "recordedYieldPerHa", "remarks", "status"
) VALUES
(1, 1, 'Yellow Corn', 'DK 8899', 'Primary', 2.50, '2024-05-10', '2024-09-10', NULL, 'Wet', 2024, 12.0, NULL, NULL, 'MT', NULL, 'Kasalukuyang namumunga', 'Standing'),
(2, 2, 'Pineapple', 'Smooth Cayenne', 'Primary', 1.80, '2023-11-01', '2025-04-30', NULL, 'Dry', 2023, 117.0, NULL, NULL, 'MT', NULL, 'Vegetative stage', 'Standing'),
(3, 3, 'Yellow Corn', 'NK6410', 'Primary', 3.00, '2024-05-15', '2024-09-20', NULL, 'Wet', 2024, 14.7, NULL, NULL, 'MT', NULL, 'Malusog ang tindig', 'Standing'),
(4, 4, 'Yellow Corn', 'DK 8899', 'Primary', 4.20, '2024-05-12', '2024-09-15', NULL, 'Wet', 2024, 21.8, NULL, NULL, 'MT', NULL, 'Whorl to tasseling', 'Standing'),
(5, 5, 'Coffee', 'Arabica Catimor', 'Primary', 2.20, '2020-08-15', '2024-11-30', NULL, 'Wet', 2020, 3.96, NULL, NULL, 'MT', NULL, 'Matutum slope berries developing', 'Standing'),
(6, 6, 'Inbred Rice', 'NSIC Rc 222', 'Primary', 3.50, '2024-06-01', '2024-10-05', NULL, 'Wet', 2024, 15.75, NULL, NULL, 'MT', NULL, 'Tillering stage', 'Standing'),
(7, 7, 'Yellow Corn', 'DK 8899', 'Primary', 2.80, '2024-05-20', '2024-09-25', NULL, 'Wet', 2024, 13.16, NULL, NULL, 'MT', NULL, 'Standing crop', 'Standing'),
(8, 8, 'White Corn', 'IPB Var 6', 'Primary', 1.50, '2024-05-18', '2024-09-18', NULL, 'Wet', 2024, 4.65, NULL, NULL, 'MT', NULL, 'Subsistence food production', 'Standing'),
(9, 9, 'Coffee', 'Robusta', 'Primary', 2.60, '2019-09-10', '2024-12-15', NULL, 'Wet', 2019, 5.72, NULL, NULL, 'MT', NULL, 'Matatag na ani ng kape', 'Standing'),
(10, 10, 'Asparagus', 'UC 157', 'Primary', 1.75, '2022-04-10', '2024-10-31', NULL, 'Wet', 2022, 10.5, NULL, NULL, 'MT', NULL, 'Patuloy ang pag-ani ng spears', 'Standing'),
(11, 11, 'Yellow Corn', 'DK 8899', 'Primary', 2.10, '2024-05-14', '2024-09-18', NULL, 'Wet', 2024, 10.29, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(12, 12, 'Yellow Corn', 'Pioneer 30T80', 'Primary', 2.40, '2024-05-22', '2024-09-28', NULL, 'Wet', 2024, 12.0, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(13, 13, 'Coffee', 'Arabica Typica', 'Primary', 3.20, '2018-07-20', '2024-11-20', NULL, 'Wet', 2018, 5.12, NULL, NULL, 'MT', NULL, 'High quality bean setting', 'Standing'),
(14, 14, 'Asparagus', 'UC 157', 'Primary', 1.90, '2022-03-15', '2024-10-15', NULL, 'Wet', 2022, 10.83, NULL, NULL, 'MT', NULL, 'Spear harvest', 'Standing'),
(15, 15, 'Yellow Corn', 'DK 8899', 'Primary', 2.70, '2024-05-11', '2024-09-15', NULL, 'Wet', 2024, 12.69, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(16, 16, 'Inbred Rice', 'NSIC Rc 160', 'Primary', 1.20, '2024-06-05', '2024-10-10', NULL, 'Wet', 2024, 5.52, NULL, NULL, 'MT', NULL, 'Vegetative tillering', 'Standing'),
(17, 17, 'Yellow Corn', 'DK 8899', 'Primary', 3.80, '2024-05-08', '2024-09-12', NULL, 'Wet', 2024, 18.24, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(18, 18, 'Asparagus', 'UC 157', 'Primary', 2.00, '2021-08-12', '2024-09-30', NULL, 'Wet', 2021, 12.2, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(19, 19, 'Hybrid Rice', 'SL-8H', 'Primary', 3.00, '2024-06-02', '2024-10-05', NULL, 'Wet', 2024, 18.6, NULL, NULL, 'MT', NULL, 'Irrigated vegetative', 'Standing'),
(20, 20, 'Yellow Corn', 'Pioneer 30T80', 'Primary', 4.50, '2024-01-15', '2024-05-20', '2024-05-25', 'Dry', 2024, 24.75, 4.50, 9.90, 'MT', 2.20, 'Nasira ng El Niño Drought noong Abril 2024', 'Harvested'),
(21, 21, 'Asparagus', 'UC 157', 'Primary', 2.30, '2021-05-10', '2024-11-15', NULL, 'Wet', 2021, 14.72, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(22, 22, 'Asparagus', 'UC 157', 'Primary', 1.80, '2022-09-01', '2024-10-31', NULL, 'Wet', 2022, 10.44, NULL, NULL, 'MT', NULL, 'Standing', 'Standing'),
(23, 23, 'Yellow Corn', 'Pioneer 30T80', 'Primary', 3.60, '2024-05-16', '2024-09-22', NULL, 'Wet', 2024, 19.08, NULL, NULL, 'MT', NULL, 'Standing', 'Standing')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Crop"', 'id'), 23);

-- -----------------------------------------------------------------------------
-- 5. INVENTORY CATALOG (Mga Karaniwang Input ng DA at OMAG)
-- -----------------------------------------------------------------------------
INSERT INTO "InventoryItem" ("id", "itemCode", "name", "category", "unit", "reorderLevel", "description", "isActive") VALUES
(1, 'SEED-RIC-INB-01', 'Certified Inbred Rice Seed (NSIC Rc 222)', 'SEEDS', 'Bags (40kg)', 50.0, 'High-yielding certified inbred seeds mula sa DA PhilRice para sa irigasyon', true),
(2, 'SEED-RIC-HYB-02', 'Hybrid Rice Seed (SL-8H)', 'SEEDS', 'Bags (15kg)', 30.0, 'High-vigor F1 hybrid rice seeds para sa mataas na ani', true),
(3, 'SEED-CRN-YEL-01', 'Hybrid Yellow Corn Seed (DK 8899)', 'SEEDS', 'Bags (18kg)', 40.0, 'Borer-protected hybrid yellow corn para sa feeds', true),
(4, 'SEED-CRN-WHT-02', 'Open-Pollinated White Corn (IPB Var 6)', 'SEEDS', 'Bags (20kg)', 25.0, 'White flint corn seed para sa konsumo ng tao', true),
(5, 'FERT-CMP-141414', 'Complete Fertilizer (14-14-14)', 'FERTILIZER', 'Bags (50kg)', 100.0, 'Inorganic granular fertilizer para sa basal application', true),
(6, 'FERT-URE-460000', 'Urea Fertilizer (46-0-0)', 'FERTILIZER', 'Bags (50kg)', 120.0, 'High-nitrogen top-dress fertilizer para sa pampadahon at paglaki', true),
(7, 'FERT-AMP-162000', 'Ammonium Phosphate (16-20-0)', 'FERTILIZER', 'Bags (50kg)', 80.0, 'Starter fertilizer para sa matibay na ugat', true),
(8, 'FERT-POT-000060', 'Muriate of Potash (0-0-60)', 'FERTILIZER', 'Bags (50kg)', 50.0, 'Potassium booster para sa pamumunga at kalidad ng butil', true)
ON CONFLICT ("itemCode") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"InventoryItem"', 'id'), 8);

-- -----------------------------------------------------------------------------
-- 6. INVENTORY BATCHES (FIFO Traced Stock)
-- -----------------------------------------------------------------------------
INSERT INTO "InventoryBatch" (
    "id", "itemId", "batchNumber", "receivedQuantity", "remainingQuantity",
    "dateReceived", "expiryDate", "viabilityDate", "supplierSource", "storageLocation", "status"
) VALUES
('b0000001-0001-0000-0000-000000000001', 1, 'BATCH-2024-RIC-01', 250.0, 180.0, '2024-04-15 09:00:00', '2025-04-15 00:00:00', '2024-10-15 00:00:00', 'DA RFO XII - PhilRice Midsayap', 'OMAG Warehouse Bay A1', 'Available'),
('b0000001-0001-0000-0000-000000000002', 2, 'BATCH-2024-RIC-02', 150.0, 95.0, '2024-04-20 10:30:00', '2025-04-20 00:00:00', '2024-10-20 00:00:00', 'SL Agritech Corp - General Santos Depot', 'OMAG Warehouse Bay A2', 'Available'),
('b0000001-0001-0000-0000-000000000003', 3, 'BATCH-2024-CRN-01', 300.0, 140.0, '2024-04-10 08:30:00', '2025-04-10 00:00:00', '2024-11-10 00:00:00', 'Bayer CropScience South Cotabato', 'OMAG Warehouse Bay B1', 'Available'),
('b0000001-0001-0000-0000-000000000004', 4, 'BATCH-2024-CRN-02', 100.0, 65.0, '2024-04-12 11:00:00', '2025-04-12 00:00:00', '2024-10-12 00:00:00', 'UPLB IPB Seed Center Distribution', 'OMAG Warehouse Bay B2', 'Available'),
('b0000001-0001-0000-0000-000000000005', 5, 'BATCH-2024-FRT-01', 500.0, 320.0, '2024-03-25 14:00:00', '2027-03-25 00:00:00', NULL, 'Atlas Fertilizer Corp - Makar Port Gensan', 'OMAG Fertilizer Shed C1', 'Available'),
('b0000001-0001-0000-0000-000000000006', 6, 'BATCH-2024-FRT-02', 600.0, 390.0, '2024-03-28 15:00:00', '2027-03-28 00:00:00', NULL, 'Planters Products Inc.', 'OMAG Fertilizer Shed C2', 'Available'),
('b0000001-0001-0000-0000-000000000007', 7, 'BATCH-2024-FRT-03', 400.0, 275.0, '2024-04-05 13:30:00', '2027-04-05 00:00:00', NULL, 'Soil Tech Agricultural Supplies', 'OMAG Fertilizer Shed C3', 'Available'),
('b0000001-0001-0000-0000-000000000008', 8, 'BATCH-2024-FRT-04', 200.0, 150.0, '2024-04-05 14:15:00', '2027-04-05 00:00:00', NULL, 'Atlas Fertilizer Corp', 'OMAG Fertilizer Shed C4', 'Available')
ON CONFLICT ("id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. BARANGAY DISTRIBUTION REQUEST & TRANSACTIONS (FIFO Tracked)
-- -----------------------------------------------------------------------------
INSERT INTO "DistributionRequest" (
    "id", "requestNumber", "barangay", "itemId", "requestedQuantity", "unit",
    "resourceType", "remarks", "status", "requestedById", "requestedAt",
    "approvedById", "approvedAt", "approvalRemarks", "distributedAt", "distributedById"
) VALUES
('req-00000001-0001-0000-0000-000000000001', 'REQ-2024-PLK-001', 'Silway 8', 3, 20.0, 'Bags (18kg)', 'Hybrid Corn Seed', 'Tulong para sa naapektuhan ng dry spell', 'DISTRIBUTED', 'a0000000-0000-0000-0000-000000000002', '2024-05-02 08:30:00', 'a0000000-0000-0000-0000-000000000001', '2024-05-03 10:00:00', 'Approved for immediate distribution under Calamity Aid', '2024-05-04 14:00:00', 'a0000000-0000-0000-0000-000000000002'),
('req-00000001-0001-0000-0000-000000000002', 'REQ-2024-PLK-002', 'Glamang', 6, 40.0, 'Bags (50kg)', 'Urea Fertilizer', 'Subsidy para sa buffer stocking', 'APPROVED', 'a0000000-0000-0000-0000-000000000002', '2024-05-15 09:15:00', 'a0000000-0000-0000-0000-000000000001', '2024-05-16 11:30:00', 'Approved for release next batch', NULL, NULL)
ON CONFLICT ("requestNumber") DO NOTHING;

INSERT INTO "DistributionRecord" (
    "id", "batchId", "farmerId", "barangay", "requestId",
    "quantityDistributed", "unit", "distributionDate", "releasedById", "purpose", "remarks"
) VALUES
('rec-00000001-0001-0000-0000-000000000001', 'b0000001-0001-0000-0000-000000000003', 20, 'Silway 8', 'req-00000001-0001-0000-0000-000000000001', 4.0, 'Bags (18kg)', '2024-05-04 14:30:00', 'a0000000-0000-0000-0000-000000000002', 'El Niño Calamity Recovery Aid', 'Natanggap nang kumpleto ng benepisyaryo'),
('rec-00000001-0001-0000-0000-000000000002', 'b0000001-0001-0000-0000-000000000005', 20, 'Silway 8', 'req-00000001-0001-0000-0000-000000000001', 8.0, 'Bags (50kg)', '2024-05-04 14:45:00', 'a0000000-0000-0000-0000-000000000002', 'Basal Fertilizer Assistance', 'Pamalit sa nasirang taniman')
ON CONFLICT ("id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. CALAMITY DAMAGE REPORT, PHOTO AUDIT, AT ASSESSMENT (El Niño Incident)
-- -----------------------------------------------------------------------------
INSERT INTO "DamageReport" (
    "id", "reportNumber", "farmerId", "parcelId", "cropId", "incidentDate",
    "calamityType", "reportedDamagePercent", "reportedAffectedAreaHa",
    "narrativeDescription", "status", "createdById", "createdAt"
) VALUES
(1, 'DMG-2024-PLK-001', 20, 20, 20, '2024-04-18 10:00:00', 'DROUGHT', 60.0, 4.50, 'Matinding pagkatuyo ng lupain at pagkasunog ng dahon ng mais sa reproductive stage dulot ng El Niño dry spell sa Silway 8.', 'COORDINATED_WITH_PCIC', 'a0000000-0000-0000-0000-000000000002', '2024-04-20 08:30:00')
ON CONFLICT ("reportNumber") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"DamageReport"', 'id'), 1);

INSERT INTO "DamageAssessment" (
    "id", "reportId", "assessedDamagePercent", "assessedAreaHa", "cropStage", "assessorNotes", "assessedAt"
) VALUES
('dass-00000001-0001-0000-0000-000000000001', 1, 60.0, 4.50, 'Reproductive / Grain Filling', 'Naberipika sa aktuwal na inspeksyon: 60% ng maisan ay nabansot at hindi nakabuo ng maayos na busal dahil sa mahigit 40 araw na walang patak ng ulan.', '2024-04-22 14:00:00')
ON CONFLICT ("reportId") DO NOTHING;

INSERT INTO "PhotoVerification" (
    "id", "farmerId", "farmId", "parcelId", "damageReportId", "storageProvider",
    "bucketName", "storageKey", "originalFileName", "fileSizeBytes", "mimeType",
    "photoTimestamp", "photoLatitude", "photoLongitude", "photoAltitude",
    "deviceMake", "deviceModel", "registeredLatitude", "registeredLongitude",
    "calculatedDistanceMeters", "thresholdMeters", "verificationStatus",
    "gpsStatus", "timestampStatus", "verificationNotes", "aiAssessment",
    "aiRecommendation", "systemReviewStatus", "systemReviewedById", "systemReviewedAt",
    "verifiedById"
) VALUES
('pv-00000001-0001-0000-0000-000000000001', 20, 20, 20, 1, 'LOCAL', 'agrivista-verifications', 'verifications/2024/04/silway8_drought_01.jpg', 'silway8_drought_01.jpg', 3450210, 'image/jpeg', '2024-04-20 09:15:30', 6.1939, 125.0854, 222.5, 'Samsung', 'Galaxy A54 5G', 6.1938, 125.0853, 15.3, 500.0, 'ACCEPTED', 'MATCH', 'VALID', 'Ang GPS coordinates ng litrato ay tugma sa nakarehistrong parsela (15.3 metro lamang ang distansya).', 'Mataas ang antas ng pagkatuyo ng halaman na umaabot sa humigit-kumulang 58-62% batay sa imahe.', 'Irekumenda para sa agarang PCIC indemnity claim processing.', 'APPROVED', 'a0000000-0000-0000-0000-000000000001', '2024-04-22 16:30:00', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT ("id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. PCIC CLAIM DOCKET AT PRIORITY RANKING
-- -----------------------------------------------------------------------------
INSERT INTO "PcicClaim" (
    "id", "claimNumber", "reportId", "claimStatus", "insurancePolicyNo",
    "filingDate", "remarks", "reviewedAt", "reviewedBy",
    "headApprovalStatus", "headApprovedById", "headApprovedAt", "headApprovalRemarks"
) VALUES
('pcic-00000001-0001-0000-0000-000000000001', 'PCIC-R12-2024-04-0089', 1, 'COORDINATED_WITH_PCIC', 'POL-CRN-2024-08912', '2024-04-23 10:00:00', 'Naipadala na ang Notice of Loss sa PCIC Regional Office XII sa Koronadal City.', '2024-04-24 11:30:00', 'OMAG Agricultural Technician', 'APPROVED', 'a0000000-0000-0000-0000-000000000001', '2024-04-25 09:00:00', 'Kumpleto ang mga patunay at georeferenced photos; aprubado para sa insurance release.')
ON CONFLICT ("claimNumber") DO NOTHING;

INSERT INTO "ClaimPriorityScore" (
    "id", "claimId", "score", "priorityLevel", "rankPosition", "formulaBreakdown", "calculatedAt"
) VALUES
('cps-00000001-0001-0000-0000-000000000001', 'pcic-00000001-0001-0000-0000-000000000001', 92.5, 'HIGH', 1, '{"damageSeverityWeight": 0.40, "severityScore": 60.0, "vulnerabilityWeight": 0.35, "vulnerabilityScore": 95.0, "seniorBonus": 10.0, "rsbsaCompliance": 100.0}', '2024-04-25 09:30:00')
ON CONFLICT ("claimId") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. ML MODEL REGISTRY AT CROP PREDICTION DECISION SUPPORT
-- -----------------------------------------------------------------------------
INSERT INTO "MlModelRegistry" (
    "id", "modelName", "modelVersion", "targetVariable", "algorithm",
    "trainingPeriod", "mae", "rmse", "r2Score", "featuresUsed", "isActive"
) VALUES
('mlm-00000001-0001-0000-0000-000000000001', 'Polomolok Corn Yield Loss Predictor', 'v2.1', 'YieldLossPercent', 'XGBoost Regressor', '2018-2023 Historic Production Data', 0.28, 0.42, 0.895, ARRAY['rainfallAnomaly', 'consecutiveDryDays', 'soilClayLoamRatio', 'plantingDateOffset', 'nitrogenApplied'], true)
ON CONFLICT ("modelName") DO NOTHING;

INSERT INTO "CropPrediction" (
    "id", "reportId", "cropId", "modelId", "projectedNormalYieldTons",
    "predictedRemainingYieldTons", "predictedYieldReductionPercent",
    "estimatedEconomicLossPhp", "inputFeaturesSnapshot"
) VALUES
('cp-00000001-0001-0000-0000-000000000001', 1, 20, 'mlm-00000001-0001-0000-0000-000000000001', 24.75, 9.90, 60.0, 267300.0, '{"rainfallAnomalyPercent": -68.4, "consecutiveDryDays": 42, "temperatureAnomalyCelsius": 2.4, "cropStage": "Reproductive"}')
ON CONFLICT ("reportId") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 11. HISTORICAL AGRICULTURAL DATA (Eksaktong 115 Talaan: 23 Barangay x 5 Panahon)
-- -----------------------------------------------------------------------------
INSERT INTO "HistoricalAgriculturalData" (
    "barangay", "year", "season", "cropType", "plantedAreaHa", "harvestedAreaHa",
    "productionTons", "averageYieldTonsHa", "seedUsageKg", "fertilizerUsageBags",
    "soilType", "calamityOccurrences", "status"
) VALUES
-- 1. Bentung
('Bentung', 2019, 'Wet', 'Yellow Corn', 120.0, 120.0, 576.0, 4.80, 2400.0, 840.0, 'Clay Loam', 0, 'ACTIVE'),
('Bentung', 2020, 'Dry', 'Yellow Corn', 95.0, 95.0, 437.0, 4.60, 1900.0, 665.0, 'Clay Loam', 0, 'ACTIVE'),
('Bentung', 2021, 'Wet', 'Asparagus', 45.0, 45.0, 279.0, 6.20, 90.0, 450.0, 'Clay Loam', 0, 'ACTIVE'),
('Bentung', 2022, 'Dry', 'Cassava', 60.0, 60.0, 870.0, 14.50, 1200.0, 360.0, 'Clay Loam', 0, 'ACTIVE'),
('Bentung', 2023, 'Wet', 'Yellow Corn', 130.0, 130.0, 650.0, 5.00, 2600.0, 910.0, 'Clay Loam', 0, 'ACTIVE'),

-- 2. Cannery Site
('Cannery Site', 2019, 'Wet', 'Pineapple', 850.0, 850.0, 55250.0, 65.00, 17000.0, 12750.0, 'Clay Loam', 0, 'ACTIVE'),
('Cannery Site', 2020, 'Dry', 'Pineapple', 820.0, 820.0, 51660.0, 63.00, 16400.0, 12300.0, 'Clay Loam', 0, 'ACTIVE'),
('Cannery Site', 2021, 'Wet', 'Yellow Corn', 80.0, 80.0, 408.0, 5.10, 1600.0, 560.0, 'Clay Loam', 0, 'ACTIVE'),
('Cannery Site', 2022, 'Dry', 'Pineapple', 860.0, 860.0, 56760.0, 66.00, 17200.0, 12900.0, 'Clay Loam', 0, 'ACTIVE'),
('Cannery Site', 2023, 'Wet', 'Yellow Corn', 85.0, 85.0, 442.0, 5.20, 1700.0, 595.0, 'Clay Loam', 0, 'ACTIVE'),

-- 3. Crossing Palkan
('Crossing Palkan', 2019, 'Wet', 'Yellow Corn', 150.0, 150.0, 735.0, 4.90, 3000.0, 1050.0, 'Sandy Loam', 0, 'ACTIVE'),
('Crossing Palkan', 2020, 'Dry', 'White Corn', 60.0, 60.0, 204.0, 3.40, 1200.0, 360.0, 'Sandy Loam', 0, 'ACTIVE'),
('Crossing Palkan', 2021, 'Wet', 'Asparagus', 40.0, 40.0, 232.0, 5.80, 80.0, 400.0, 'Sandy Loam', 0, 'ACTIVE'),
('Crossing Palkan', 2022, 'Dry', 'Yellow Corn', 135.0, 135.0, 634.5, 4.70, 2700.0, 945.0, 'Sandy Loam', 0, 'ACTIVE'),
('Crossing Palkan', 2023, 'Wet', 'Yellow Corn', 160.0, 160.0, 816.0, 5.10, 3200.0, 1120.0, 'Sandy Loam', 0, 'ACTIVE'),

-- 4. Glamang
('Glamang', 2019, 'Wet', 'Yellow Corn', 320.0, 320.0, 1664.0, 5.20, 6400.0, 2240.0, 'Clay Loam', 0, 'ACTIVE'),
('Glamang', 2020, 'Dry', 'White Corn', 110.0, 110.0, 352.0, 3.20, 2200.0, 660.0, 'Clay Loam', 0, 'ACTIVE'),
('Glamang', 2021, 'Wet', 'Inbred Rice', 65.0, 65.0, 292.5, 4.50, 2600.0, 520.0, 'Clay Loam', 0, 'ACTIVE'),
('Glamang', 2022, 'Dry', 'Yellow Corn', 290.0, 290.0, 1450.0, 5.00, 5800.0, 2030.0, 'Clay Loam', 0, 'ACTIVE'),
('Glamang', 2023, 'Wet', 'Yellow Corn', 340.0, 340.0, 1836.0, 5.40, 6800.0, 2380.0, 'Clay Loam', 0, 'ACTIVE'),

-- 5. Kinilis
('Kinilis', 2019, 'Wet', 'Coffee', 90.0, 90.0, 162.0, 1.80, 1800.0, 450.0, 'Sandy Loam', 0, 'ACTIVE'),
('Kinilis', 2020, 'Dry', 'Banana', 75.0, 75.0, 1350.0, 18.00, 1500.0, 600.0, 'Sandy Loam', 0, 'ACTIVE'),
('Kinilis', 2021, 'Wet', 'Yellow Corn', 60.0, 60.0, 252.0, 4.20, 1200.0, 420.0, 'Sandy Loam', 0, 'ACTIVE'),
('Kinilis', 2022, 'Dry', 'Coffee', 95.0, 95.0, 180.5, 1.90, 1900.0, 475.0, 'Sandy Loam', 0, 'ACTIVE'),
('Kinilis', 2023, 'Wet', 'Coffee', 100.0, 100.0, 195.0, 1.95, 2000.0, 500.0, 'Sandy Loam', 0, 'ACTIVE'),

-- 6. Klinan 6
('Klinan 6', 2019, 'Wet', 'Yellow Corn', 240.0, 240.0, 1296.0, 5.40, 4800.0, 1680.0, 'Clay Loam', 0, 'ACTIVE'),
('Klinan 6', 2020, 'Dry', 'Inbred Rice', 85.0, 85.0, 365.5, 4.30, 3400.0, 680.0, 'Clay Loam', 0, 'ACTIVE'),
('Klinan 6', 2021, 'Wet', 'Hybrid Rice', 70.0, 70.0, 427.0, 6.10, 1050.0, 630.0, 'Clay Loam', 0, 'ACTIVE'),
('Klinan 6', 2022, 'Dry', 'Yellow Corn', 220.0, 220.0, 1144.0, 5.20, 4400.0, 1540.0, 'Clay Loam', 0, 'ACTIVE'),
('Klinan 6', 2023, 'Wet', 'Yellow Corn', 260.0, 260.0, 1430.0, 5.50, 5200.0, 1820.0, 'Clay Loam', 0, 'ACTIVE'),

-- 7. Koronadal Proper
('Koronadal Proper', 2019, 'Wet', 'Yellow Corn', 170.0, 170.0, 799.0, 4.70, 3400.0, 1190.0, 'Clay Loam', 0, 'ACTIVE'),
('Koronadal Proper', 2020, 'Dry', 'Inbred Rice', 45.0, 45.0, 198.0, 4.40, 1800.0, 360.0, 'Clay Loam', 0, 'ACTIVE'),
('Koronadal Proper', 2021, 'Wet', 'Cassava', 50.0, 50.0, 750.0, 15.00, 1000.0, 300.0, 'Clay Loam', 0, 'ACTIVE'),
('Koronadal Proper', 2022, 'Dry', 'Yellow Corn', 155.0, 155.0, 713.0, 4.60, 3100.0, 1085.0, 'Clay Loam', 0, 'ACTIVE'),
('Koronadal Proper', 2023, 'Wet', 'Yellow Corn', 180.0, 180.0, 882.0, 4.90, 3600.0, 1260.0, 'Clay Loam', 0, 'ACTIVE'),

-- 8. Lam-Caliaf
('Lam-Caliaf', 2019, 'Wet', 'Yellow Corn', 90.0, 90.0, 414.0, 4.60, 1800.0, 630.0, 'Clay Loam', 0, 'ACTIVE'),
('Lam-Caliaf', 2020, 'Dry', 'White Corn', 40.0, 40.0, 124.0, 3.10, 800.0, 240.0, 'Clay Loam', 0, 'ACTIVE'),
('Lam-Caliaf', 2021, 'Wet', 'Cassava', 35.0, 35.0, 483.0, 13.80, 700.0, 210.0, 'Clay Loam', 0, 'ACTIVE'),
('Lam-Caliaf', 2022, 'Dry', 'Yellow Corn', 85.0, 85.0, 382.5, 4.50, 1700.0, 595.0, 'Clay Loam', 0, 'ACTIVE'),
('Lam-Caliaf', 2023, 'Wet', 'Yellow Corn', 95.0, 95.0, 456.0, 4.80, 1900.0, 665.0, 'Clay Loam', 0, 'ACTIVE'),

-- 9. Landan
('Landan', 2019, 'Wet', 'Coffee', 160.0, 160.0, 352.0, 2.20, 3200.0, 800.0, 'Sandy Loam', 0, 'ACTIVE'),
('Landan', 2020, 'Dry', 'Yellow Corn', 140.0, 140.0, 602.0, 4.30, 2800.0, 980.0, 'Sandy Loam', 0, 'ACTIVE'),
('Landan', 2021, 'Wet', 'Banana', 110.0, 110.0, 3080.0, 28.00, 2200.0, 1100.0, 'Sandy Loam', 0, 'ACTIVE'),
('Landan', 2022, 'Dry', 'Coffee', 170.0, 170.0, 391.0, 2.30, 3400.0, 850.0, 'Sandy Loam', 0, 'ACTIVE'),
('Landan', 2023, 'Wet', 'Coffee', 175.0, 175.0, 420.0, 2.40, 3500.0, 875.0, 'Sandy Loam', 0, 'ACTIVE'),

-- 10. Lapu
('Lapu', 2019, 'Wet', 'Asparagus', 65.0, 65.0, 390.0, 6.00, 130.0, 650.0, 'Clay Loam', 0, 'ACTIVE'),
('Lapu', 2020, 'Dry', 'Yellow Corn', 80.0, 80.0, 400.0, 5.00, 1600.0, 560.0, 'Clay Loam', 0, 'ACTIVE'),
('Lapu', 2021, 'Wet', 'White Corn', 35.0, 35.0, 115.5, 3.30, 700.0, 210.0, 'Clay Loam', 0, 'ACTIVE'),
('Lapu', 2022, 'Dry', 'Asparagus', 68.0, 68.0, 414.8, 6.10, 136.0, 680.0, 'Clay Loam', 0, 'ACTIVE'),
('Lapu', 2023, 'Wet', 'Asparagus', 70.0, 70.0, 441.0, 6.30, 140.0, 700.0, 'Clay Loam', 0, 'ACTIVE'),

-- 11. Lumakil
('Lumakil', 2019, 'Wet', 'Asparagus', 50.0, 50.0, 295.0, 5.90, 100.0, 500.0, 'Clay Loam', 0, 'ACTIVE'),
('Lumakil', 2020, 'Dry', 'Yellow Corn', 110.0, 110.0, 539.0, 4.90, 2200.0, 770.0, 'Clay Loam', 0, 'ACTIVE'),
('Lumakil', 2021, 'Wet', 'Inbred Rice', 40.0, 40.0, 168.0, 4.20, 1600.0, 320.0, 'Clay Loam', 0, 'ACTIVE'),
('Lumakil', 2022, 'Dry', 'Asparagus', 52.0, 52.0, 312.0, 6.00, 104.0, 520.0, 'Clay Loam', 0, 'ACTIVE'),
('Lumakil', 2023, 'Wet', 'Yellow Corn', 115.0, 115.0, 586.5, 5.10, 2300.0, 805.0, 'Clay Loam', 0, 'ACTIVE'),

-- 12. Magsaysay
('Magsaysay', 2019, 'Wet', 'Asparagus', 75.0, 75.0, 472.5, 6.30, 150.0, 750.0, 'Clay Loam', 0, 'ACTIVE'),
('Magsaysay', 2020, 'Dry', 'Yellow Corn', 125.0, 125.0, 625.0, 5.00, 2500.0, 875.0, 'Clay Loam', 0, 'ACTIVE'),
('Magsaysay', 2021, 'Wet', 'Vegetables', 30.0, 30.0, 255.0, 8.50, 60.0, 300.0, 'Clay Loam', 0, 'ACTIVE'),
('Magsaysay', 2022, 'Dry', 'Asparagus', 78.0, 78.0, 499.2, 6.40, 156.0, 780.0, 'Clay Loam', 0, 'ACTIVE'),
('Magsaysay', 2023, 'Wet', 'Yellow Corn', 130.0, 130.0, 676.0, 5.20, 2600.0, 910.0, 'Clay Loam', 0, 'ACTIVE'),

-- 13. Maligo
('Maligo', 2019, 'Wet', 'Coffee', 120.0, 120.0, 192.0, 1.60, 2400.0, 600.0, 'Sandy Loam', 0, 'ACTIVE'),
('Maligo', 2020, 'Dry', 'Banana', 90.0, 90.0, 1575.0, 17.50, 1800.0, 720.0, 'Sandy Loam', 0, 'ACTIVE'),
('Maligo', 2021, 'Wet', 'Yellow Corn', 80.0, 80.0, 328.0, 4.10, 1600.0, 560.0, 'Sandy Loam', 0, 'ACTIVE'),
('Maligo', 2022, 'Dry', 'Coffee', 130.0, 130.0, 221.0, 1.70, 2600.0, 650.0, 'Sandy Loam', 0, 'ACTIVE'),
('Maligo', 2023, 'Wet', 'Coffee', 140.0, 140.0, 252.0, 1.80, 2800.0, 700.0, 'Sandy Loam', 0, 'ACTIVE'),

-- 14. Pagalungan
('Pagalungan', 2019, 'Wet', 'Asparagus', 60.0, 60.0, 342.0, 5.70, 120.0, 600.0, 'Clay Loam', 0, 'ACTIVE'),
('Pagalungan', 2020, 'Dry', 'Yellow Corn', 115.0, 115.0, 586.5, 5.10, 2300.0, 805.0, 'Clay Loam', 0, 'ACTIVE'),
('Pagalungan', 2021, 'Wet', 'White Corn', 45.0, 45.0, 157.5, 3.50, 900.0, 270.0, 'Clay Loam', 0, 'ACTIVE'),
('Pagalungan', 2022, 'Dry', 'Asparagus', 62.0, 62.0, 365.8, 5.90, 124.0, 620.0, 'Clay Loam', 0, 'ACTIVE'),
('Pagalungan', 2023, 'Wet', 'Yellow Corn', 120.0, 120.0, 636.0, 5.30, 2400.0, 840.0, 'Clay Loam', 0, 'ACTIVE'),

-- 15. Palkan
('Palkan', 2019, 'Wet', 'Yellow Corn', 160.0, 160.0, 752.0, 4.70, 3200.0, 1120.0, 'Sandy Loam', 0, 'ACTIVE'),
('Palkan', 2020, 'Dry', 'Coffee', 65.0, 65.0, 130.0, 2.00, 1300.0, 325.0, 'Sandy Loam', 0, 'ACTIVE'),
('Palkan', 2021, 'Wet', 'White Corn', 50.0, 50.0, 150.0, 3.00, 1000.0, 300.0, 'Sandy Loam', 0, 'ACTIVE'),
('Palkan', 2022, 'Dry', 'Yellow Corn', 150.0, 150.0, 690.0, 4.60, 3000.0, 1050.0, 'Sandy Loam', 0, 'ACTIVE'),
('Palkan', 2023, 'Wet', 'Yellow Corn', 170.0, 170.0, 833.0, 4.90, 3400.0, 1190.0, 'Sandy Loam', 0, 'ACTIVE'),

-- 16. Poblacion
('Poblacion', 2019, 'Wet', 'Inbred Rice', 50.0, 50.0, 230.0, 4.60, 2000.0, 400.0, 'Clay Loam', 0, 'ACTIVE'),
('Poblacion', 2020, 'Dry', 'Yellow Corn', 60.0, 60.0, 318.0, 5.30, 1200.0, 420.0, 'Clay Loam', 0, 'ACTIVE'),
('Poblacion', 2021, 'Wet', 'Vegetables', 25.0, 25.0, 275.0, 11.00, 50.0, 250.0, 'Clay Loam', 0, 'ACTIVE'),
('Poblacion', 2022, 'Dry', 'Inbred Rice', 48.0, 48.0, 216.0, 4.50, 1920.0, 384.0, 'Clay Loam', 0, 'ACTIVE'),
('Poblacion', 2023, 'Wet', 'Inbred Rice', 52.0, 52.0, 244.4, 4.70, 2080.0, 416.0, 'Clay Loam', 0, 'ACTIVE'),

-- 17. Polo
('Polo', 2019, 'Wet', 'Yellow Corn', 180.0, 180.0, 864.0, 4.80, 3600.0, 1260.0, 'Sandy Loam', 0, 'ACTIVE'),
('Polo', 2020, 'Dry', 'Pineapple', 220.0, 220.0, 13640.0, 62.00, 4400.0, 3300.0, 'Sandy Loam', 0, 'ACTIVE'),
('Polo', 2021, 'Wet', 'Cassava', 55.0, 55.0, 770.0, 14.00, 1100.0, 330.0, 'Sandy Loam', 0, 'ACTIVE'),
('Polo', 2022, 'Dry', 'Yellow Corn', 175.0, 175.0, 822.5, 4.70, 3500.0, 1225.0, 'Sandy Loam', 0, 'ACTIVE'),
('Polo', 2023, 'Wet', 'Yellow Corn', 190.0, 190.0, 950.0, 5.00, 3800.0, 1330.0, 'Sandy Loam', 0, 'ACTIVE'),

-- 18. Rubber
('Rubber', 2019, 'Wet', 'Asparagus', 85.0, 85.0, 518.5, 6.10, 170.0, 850.0, 'Clay Loam', 0, 'ACTIVE'),
('Rubber', 2020, 'Dry', 'Yellow Corn', 130.0, 130.0, 637.0, 4.90, 2600.0, 910.0, 'Clay Loam', 0, 'ACTIVE'),
('Rubber', 2021, 'Wet', 'Rubber', 40.0, 40.0, 84.0, 2.10, 800.0, 240.0, 'Clay Loam', 0, 'ACTIVE'),
('Rubber', 2022, 'Dry', 'Asparagus', 88.0, 88.0, 545.6, 6.20, 176.0, 880.0, 'Clay Loam', 0, 'ACTIVE'),
('Rubber', 2023, 'Wet', 'Asparagus', 90.0, 90.0, 576.0, 6.40, 180.0, 900.0, 'Clay Loam', 0, 'ACTIVE'),

-- 19. Silway 7
('Silway 7', 2019, 'Wet', 'Hybrid Rice', 110.0, 110.0, 682.0, 6.20, 1650.0, 990.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 7', 2020, 'Dry', 'Inbred Rice', 95.0, 95.0, 418.0, 4.40, 3800.0, 760.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 7', 2021, 'Wet', 'Yellow Corn', 140.0, 140.0, 714.0, 5.10, 2800.0, 980.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 7', 2022, 'Dry', 'Hybrid Rice', 105.0, 105.0, 640.5, 6.10, 1575.0, 945.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 7', 2023, 'Wet', 'Hybrid Rice', 120.0, 120.0, 768.0, 6.40, 1800.0, 1080.0, 'Clay Loam', 0, 'ACTIVE'),

-- 20. Silway 8 (Kabilang ang tala noong 2024 El Niño Drought)
('Silway 8', 2019, 'Wet', 'Hybrid Rice', 140.0, 140.0, 896.0, 6.40, 2100.0, 1260.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 8', 2020, 'Dry', 'Inbred Rice', 120.0, 120.0, 564.0, 4.70, 4800.0, 960.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 8', 2021, 'Wet', 'Yellow Corn', 210.0, 210.0, 1155.0, 5.50, 4200.0, 1470.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 8', 2022, 'Dry', 'Hybrid Rice', 135.0, 135.0, 850.5, 6.30, 2025.0, 1215.0, 'Clay Loam', 0, 'ACTIVE'),
('Silway 8', 2024, 'Dry', 'Yellow Corn', 190.0, 110.0, 242.0, 2.20, 3800.0, 770.0, 'Clay Loam', 2, 'ACTIVE'),

-- 21. Sulit
('Sulit', 2019, 'Wet', 'Asparagus', 110.0, 110.0, 704.0, 6.40, 220.0, 1100.0, 'Clay Loam', 0, 'ACTIVE'),
('Sulit', 2020, 'Dry', 'Yellow Corn', 150.0, 150.0, 780.0, 5.20, 3000.0, 1050.0, 'Clay Loam', 0, 'ACTIVE'),
('Sulit', 2021, 'Wet', 'White Corn', 60.0, 60.0, 216.0, 3.60, 1200.0, 360.0, 'Clay Loam', 0, 'ACTIVE'),
('Sulit', 2022, 'Dry', 'Asparagus', 115.0, 115.0, 747.5, 6.50, 230.0, 1150.0, 'Clay Loam', 0, 'ACTIVE'),
('Sulit', 2023, 'Wet', 'Asparagus', 120.0, 120.0, 804.0, 6.70, 240.0, 1200.0, 'Clay Loam', 0, 'ACTIVE'),

-- 22. Sumbakil
('Sumbakil', 2019, 'Wet', 'Asparagus', 70.0, 70.0, 406.0, 5.80, 140.0, 700.0, 'Clay Loam', 0, 'ACTIVE'),
('Sumbakil', 2020, 'Dry', 'Yellow Corn', 95.0, 95.0, 446.5, 4.70, 1900.0, 665.0, 'Clay Loam', 0, 'ACTIVE'),
('Sumbakil', 2021, 'Wet', 'Cassava', 40.0, 40.0, 592.0, 14.80, 800.0, 240.0, 'Clay Loam', 0, 'ACTIVE'),
('Sumbakil', 2022, 'Dry', 'Asparagus', 72.0, 72.0, 432.0, 6.00, 144.0, 720.0, 'Clay Loam', 0, 'ACTIVE'),
('Sumbakil', 2023, 'Wet', 'Asparagus', 75.0, 75.0, 465.0, 6.20, 150.0, 750.0, 'Clay Loam', 0, 'ACTIVE'),

-- 23. Upper Klinan
('Upper Klinan', 2019, 'Wet', 'Yellow Corn', 200.0, 200.0, 1060.0, 5.30, 4000.0, 1400.0, 'Clay Loam', 0, 'ACTIVE'),
('Upper Klinan', 2020, 'Dry', 'Inbred Rice', 75.0, 75.0, 337.5, 4.50, 3000.0, 600.0, 'Clay Loam', 0, 'ACTIVE'),
('Upper Klinan', 2021, 'Wet', 'Hybrid Rice', 60.0, 60.0, 360.0, 6.00, 900.0, 540.0, 'Clay Loam', 0, 'ACTIVE'),
('Upper Klinan', 2022, 'Dry', 'Yellow Corn', 190.0, 190.0, 988.0, 5.20, 3800.0, 1330.0, 'Clay Loam', 0, 'ACTIVE'),
('Upper Klinan', 2023, 'Wet', 'Yellow Corn', 220.0, 220.0, 1210.0, 5.50, 4400.0, 1540.0, 'Clay Loam', 0, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 12. RESOURCE DEMAND FORECAST PARA SA TAONG 2025
-- -----------------------------------------------------------------------------
INSERT INTO "ResourceDemandForecast" (
    "id", "barangay", "cropType", "forecastYear", "forecastSeason",
    "projectedAreaHa", "forecastSeedKg", "forecastFertilizerBags",
    "methodUsed", "confidenceMetric", "limitationsNotice", "projectedFarmers",
    "modelVersion", "isSynthetic", "createdById"
) VALUES
('rdf-00000001-0001-0000-0000-000000000001', 'Glamang', 'Yellow Corn', 2025, 'Wet', 350.0, 7000.0, 2450.0, 'ARIMA Time-Series + OMAG Target', 0.91, 'Ipinagpapalagay na magiging normal ang ulan matapos ang El Niño.', 140, 'v1.4', false, 'a0000000-0000-0000-0000-000000000001'),
('rdf-00000001-0001-0000-0000-000000000002', 'Silway 8', 'Hybrid Rice', 2025, 'Wet', 130.0, 1950.0, 1170.0, 'Moving Average on Irrigated Blocks', 0.88, 'Nakasandig sa buong kapasidad ng NIA Silway River irrigation dam.', 65, 'v1.4', false, 'a0000000-0000-0000-0000-000000000001'),
('rdf-00000001-0001-0000-0000-000000000003', 'Sulit', 'Asparagus', 2025, 'Dry', 125.0, 250.0, 1250.0, 'Export Contract Acreage Projection', 0.94, 'Limitado sa mga rehistradong contract growers ng export cannery.', 85, 'v1.4', false, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT ("id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 13. SYSTEM AUDIT LOG (Pagtatala ng Seed Insertion)
-- -----------------------------------------------------------------------------
INSERT INTO "AuditLog" (
    "id", "userId", "roleSnapshot", "action", "module", "recordId",
    "previousValues", "newValues", "ipAddress"
) VALUES
('aud-00000001-0001-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'OMAG_HEAD', 'SEED_DATABASE_INITIALIZATION', 'SYSTEM_ADMIN', 'ALL_TABLES', NULL, '{"totalBarangays": 23, "farmersCreated": 23, "historicalRows": 115, "calamityEvent": "2024 El Nino Drought"}', '192.168.1.100')
ON CONFLICT ("id") DO NOTHING;

COMMIT;
