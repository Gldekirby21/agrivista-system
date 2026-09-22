-- =============================================================================
-- AGRIVISTA 3.0: OMAG POLOMOLOK AGRICULTURAL MANAGEMENT SYSTEM
-- Target RDBMS: Oracle Database 12c / 19c / 21c
-- Designed for: Oracle SQL Developer Data Modeler
-- Description: 14 Core Entities mapped directly from the Logical Model
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USER ENTITY (Sentral na tagapamahala ng OMAG)
-- -----------------------------------------------------------------------------
CREATE TABLE USERS (
    user_id VARCHAR2(64) NOT NULL,
    username VARCHAR2(100) NOT NULL,
    email VARCHAR2(255) NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    full_name VARCHAR2(255) NOT NULL,
    role VARCHAR2(20) DEFAULT 'OMAG_STAFF' NOT NULL,
    is_active NUMBER(1) DEFAULT 1 NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT ck_users_role CHECK (role IN ('OMAG_HEAD', 'OMAG_STAFF'))
);

-- -----------------------------------------------------------------------------
-- 2. FARMER ENTITY (Objective 1: RSBSA Beneficiary Profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE FARMER (
    farmer_id NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL,
    rsbsa_number VARCHAR2(64),
    farmer_code VARCHAR2(64),
    first_name VARCHAR2(100) NOT NULL,
    middle_name VARCHAR2(100),
    last_name VARCHAR2(100) NOT NULL,
    extension_name VARCHAR2(20),
    sex VARCHAR2(10) NOT NULL,
    date_of_birth DATE NOT NULL,
    contact_number VARCHAR2(30),
    barangay VARCHAR2(100) NOT NULL,
    municipality VARCHAR2(100) DEFAULT 'Polomolok' NOT NULL,
    province VARCHAR2(100) DEFAULT 'South Cotabato' NOT NULL,
    status VARCHAR2(30) DEFAULT 'Active' NOT NULL,
    CONSTRAINT pk_farmer PRIMARY KEY (farmer_id),
    CONSTRAINT uq_farmer_rsbsa UNIQUE (rsbsa_number)
);

-- -----------------------------------------------------------------------------
-- 3. FARM ENTITY (Objective 1: Landholding Profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE FARM (
    farm_id NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL,
    farmer_id NUMBER NOT NULL,
    farm_code VARCHAR2(64),
    farm_name VARCHAR2(150),
    barangay VARCHAR2(100) NOT NULL,
    sitio_purok VARCHAR2(150),
    total_area_ha NUMBER(10, 4) NOT NULL,
    tenure_type VARCHAR2(50) DEFAULT 'Owned' NOT NULL,
    water_source VARCHAR2(50) DEFAULT 'Rainfed' NOT NULL,
    status VARCHAR2(30) DEFAULT 'Active' NOT NULL,
    CONSTRAINT pk_farm PRIMARY KEY (farm_id)
);

-- -----------------------------------------------------------------------------
-- 4. FARM_PARCEL ENTITY (Objective 1 & 2: Georeferenced Plots)
-- -----------------------------------------------------------------------------
CREATE TABLE FARM_PARCEL (
    parcel_id NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL,
    farm_id NUMBER NOT NULL,
    parcel_number VARCHAR2(64) NOT NULL,
    latitude NUMBER(11, 8),
    longitude NUMBER(11, 8),
    area_ha NUMBER(10, 4) NOT NULL,
    soil_type VARCHAR2(50),
    status VARCHAR2(30) DEFAULT 'Active' NOT NULL,
    CONSTRAINT pk_farm_parcel PRIMARY KEY (parcel_id)
);

-- -----------------------------------------------------------------------------
-- 5. CROP ENTITY (Objective 1: Planting Cycles)
-- -----------------------------------------------------------------------------
CREATE TABLE CROP (
    crop_id NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL,
    parcel_id NUMBER NOT NULL,
    crop_type VARCHAR2(100) NOT NULL,
    variety VARCHAR2(100),
    planted_area_ha NUMBER(10, 4) NOT NULL,
    planting_date DATE NOT NULL,
    season VARCHAR2(50) NOT NULL,
    harvest_year NUMBER(4) NOT NULL,
    historical_yield_tons NUMBER(10, 2),
    status VARCHAR2(50) DEFAULT 'Standing' NOT NULL,
    CONSTRAINT pk_crop PRIMARY KEY (crop_id)
);

-- -----------------------------------------------------------------------------
-- 6. LAND_DOCUMENT ENTITY (Objective 1: Multi-Format Document Archive)
-- -----------------------------------------------------------------------------
CREATE TABLE LAND_DOCUMENT (
    document_id VARCHAR2(64) NOT NULL,
    farm_id NUMBER NOT NULL,
    uploaded_by_user_id VARCHAR2(64) NOT NULL,
    document_type VARCHAR2(100) NOT NULL,
    file_url VARCHAR2(255) NOT NULL,
    file_format VARCHAR2(30) NOT NULL,
    verification_status VARCHAR2(50) DEFAULT 'Pending' NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_land_document PRIMARY KEY (document_id)
);

-- -----------------------------------------------------------------------------
-- 7. PCIC_CLAIM ENTITY (Objective 6: Prioritization & Case Monitoring)
-- -----------------------------------------------------------------------------
CREATE TABLE PCIC_CLAIM (
    claim_id VARCHAR2(64) NOT NULL,
    crop_id NUMBER NOT NULL,
    handled_by_user_id VARCHAR2(64) NOT NULL,
    claim_number VARCHAR2(64) NOT NULL,
    incident_date DATE NOT NULL,
    calamity_type VARCHAR2(100) NOT NULL,
    reported_damage_percent NUMBER(5, 2) NOT NULL,
    assessed_damage_percent NUMBER(5, 2),
    priority_level VARCHAR2(10) DEFAULT 'MEDIUM' NOT NULL,
    severity_rank NUMBER(6),
    claim_status VARCHAR2(30) DEFAULT 'SUBMITTED' NOT NULL,
    filing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_pcic_claim PRIMARY KEY (claim_id),
    CONSTRAINT uq_pcic_claim_number UNIQUE (claim_number),
    CONSTRAINT ck_pcic_priority CHECK (priority_level IN ('HIGH', 'MEDIUM', 'LOW'))
);

-- -----------------------------------------------------------------------------
-- 8. PHOTO_VERIFICATION ENTITY (Objective 2: AI Tamper-Proof Audit Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE PHOTO_VERIFICATION (
    verification_id VARCHAR2(64) NOT NULL,
    claim_id VARCHAR2(64) NOT NULL,
    photo_url VARCHAR2(255) NOT NULL,
    photo_latitude NUMBER(11, 8),
    photo_longitude NUMBER(11, 8),
    photo_timestamp TIMESTAMP,
    calculated_distance_meters NUMBER(10, 2),
    verification_status VARCHAR2(50) NOT NULL,
    ai_tamper_audit_notes VARCHAR2(500),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_photo_verification PRIMARY KEY (verification_id)
);

-- -----------------------------------------------------------------------------
-- 9. CROP_PREDICTION ENTITY (Objective 3: ML Yield & Economic Loss Prediction)
-- -----------------------------------------------------------------------------
CREATE TABLE CROP_PREDICTION (
    prediction_id VARCHAR2(64) NOT NULL,
    claim_id VARCHAR2(64) NOT NULL,
    predicted_remaining_yield NUMBER(10, 2) NOT NULL,
    predicted_reduction_percent NUMBER(5, 2) NOT NULL,
    estimated_economic_loss_php NUMBER(12, 2) NOT NULL,
    algorithm_used VARCHAR2(100),
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_crop_prediction PRIMARY KEY (prediction_id),
    CONSTRAINT uq_crop_pred_claim UNIQUE (claim_id)
);

-- -----------------------------------------------------------------------------
-- 10. INVENTORY_ITEM ENTITY (Objective 4: Catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE INVENTORY_ITEM (
    item_id NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL,
    item_code VARCHAR2(64) NOT NULL,
    item_name VARCHAR2(150) NOT NULL,
    category VARCHAR2(20) NOT NULL,
    unit VARCHAR2(30) NOT NULL,
    reorder_level NUMBER(10, 2) DEFAULT 10.0 NOT NULL,
    CONSTRAINT pk_inventory_item PRIMARY KEY (item_id),
    CONSTRAINT uq_item_code UNIQUE (item_code),
    CONSTRAINT ck_item_category CHECK (category IN ('SEEDS', 'FERTILIZER'))
);

-- -----------------------------------------------------------------------------
-- 11. INVENTORY_BATCH ENTITY (Objective 4: FIFO Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE INVENTORY_BATCH (
    batch_id VARCHAR2(64) NOT NULL,
    item_id NUMBER NOT NULL,
    batch_number VARCHAR2(64) NOT NULL,
    received_quantity NUMBER(10, 2) NOT NULL,
    remaining_quantity NUMBER(10, 2) NOT NULL,
    date_received DATE NOT NULL,
    expiration_viability_date DATE NOT NULL,
    status VARCHAR2(50) DEFAULT 'Available' NOT NULL,
    CONSTRAINT pk_inventory_batch PRIMARY KEY (batch_id)
);

-- -----------------------------------------------------------------------------
-- 12. DISTRIBUTION_RECORD ENTITY (Objective 4: Stock Disbursal Log)
-- -----------------------------------------------------------------------------
CREATE TABLE DISTRIBUTION_RECORD (
    distribution_id VARCHAR2(64) NOT NULL,
    batch_id VARCHAR2(64) NOT NULL,
    farmer_id NUMBER NOT NULL,
    released_by_user_id VARCHAR2(64) NOT NULL,
    quantity_distributed NUMBER(10, 2) NOT NULL,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks VARCHAR2(255),
    CONSTRAINT pk_distribution_record PRIMARY KEY (distribution_id)
);

-- -----------------------------------------------------------------------------
-- 13. HISTORICAL_AGRI_DATA ENTITY (Objective 5: Baseline Data Repository)
-- -----------------------------------------------------------------------------
CREATE TABLE HISTORICAL_AGRI_DATA (
    historical_id NUMBER GENERATED ALWAYS AS IDENTITY NOT NULL,
    encoded_by_user_id VARCHAR2(64) NOT NULL,
    barangay VARCHAR2(100) NOT NULL,
    production_year NUMBER(4) NOT NULL,
    season VARCHAR2(50) NOT NULL,
    crop_type VARCHAR2(100) NOT NULL,
    production_tons NUMBER(10, 2) NOT NULL,
    CONSTRAINT pk_historical_agri_data PRIMARY KEY (historical_id)
);

-- -----------------------------------------------------------------------------
-- 14. RESOURCE_DEMAND_FORECAST ENTITY (Objective 5: Resource Planning Output)
-- -----------------------------------------------------------------------------
CREATE TABLE RESOURCE_DEMAND_FORECAST (
    forecast_id VARCHAR2(64) NOT NULL,
    historical_data_id NUMBER NOT NULL,
    barangay VARCHAR2(100) NOT NULL,
    crop_type VARCHAR2(100) NOT NULL,
    forecast_year NUMBER(4) NOT NULL,
    forecast_season VARCHAR2(50) NOT NULL,
    forecast_seed_kg NUMBER(10, 2) NOT NULL,
    forecast_fertilizer_bags NUMBER(10, 2) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_resource_forecast PRIMARY KEY (forecast_id)
);

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS (Single Direction / Zero Crossings)
-- =============================================================================

-- Landholdings and Crops Flow
ALTER TABLE FARM ADD CONSTRAINT fk_farm_farmer 
    FOREIGN KEY (farmer_id) REFERENCES FARMER (farmer_id);

ALTER TABLE FARM_PARCEL ADD CONSTRAINT fk_parcel_farm 
    FOREIGN KEY (farm_id) REFERENCES FARM (farm_id);

ALTER TABLE CROP ADD CONSTRAINT fk_crop_parcel 
    FOREIGN KEY (parcel_id) REFERENCES FARM_PARCEL (parcel_id);

-- Document Uploads
ALTER TABLE LAND_DOCUMENT ADD CONSTRAINT fk_doc_farm 
    FOREIGN KEY (farm_id) REFERENCES FARM (farm_id);

ALTER TABLE LAND_DOCUMENT ADD CONSTRAINT fk_doc_user 
    FOREIGN KEY (uploaded_by_user_id) REFERENCES USERS (user_id);

-- Damage Claims, AI Verification, and ML Predictions
ALTER TABLE PCIC_CLAIM ADD CONSTRAINT fk_claim_crop 
    FOREIGN KEY (crop_id) REFERENCES CROP (crop_id);

ALTER TABLE PCIC_CLAIM ADD CONSTRAINT fk_claim_user 
    FOREIGN KEY (handled_by_user_id) REFERENCES USERS (user_id);

ALTER TABLE PHOTO_VERIFICATION ADD CONSTRAINT fk_photo_claim 
    FOREIGN KEY (claim_id) REFERENCES PCIC_CLAIM (claim_id);

ALTER TABLE CROP_PREDICTION ADD CONSTRAINT fk_pred_claim 
    FOREIGN KEY (claim_id) REFERENCES PCIC_CLAIM (claim_id);

-- FIFO Inventory & Distribution
ALTER TABLE INVENTORY_BATCH ADD CONSTRAINT fk_batch_item 
    FOREIGN KEY (item_id) REFERENCES INVENTORY_ITEM (item_id);

ALTER TABLE DISTRIBUTION_RECORD ADD CONSTRAINT fk_dist_batch 
    FOREIGN KEY (batch_id) REFERENCES INVENTORY_BATCH (batch_id);

ALTER TABLE DISTRIBUTION_RECORD ADD CONSTRAINT fk_dist_farmer 
    FOREIGN KEY (farmer_id) REFERENCES FARMER (farmer_id);

ALTER TABLE DISTRIBUTION_RECORD ADD CONSTRAINT fk_dist_user 
    FOREIGN KEY (released_by_user_id) REFERENCES USERS (user_id);

-- Forecasting Module (Connected)
ALTER TABLE HISTORICAL_AGRI_DATA ADD CONSTRAINT fk_hist_user 
    FOREIGN KEY (encoded_by_user_id) REFERENCES USERS (user_id);

ALTER TABLE RESOURCE_DEMAND_FORECAST ADD CONSTRAINT fk_forecast_hist 
    FOREIGN KEY (historical_data_id) REFERENCES HISTORICAL_AGRI_DATA (historical_id);