--
-- PostgreSQL database dump
--

\restrict uLVdLhhbp3bevZpKuik7iRU4kaIXYmvrgCR4uohK6I7wO16NSUYcQuy1jUpFD3V

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ClaimStatus; Type: TYPE; Schema: public; Owner: agrivista_user
--

CREATE TYPE public."ClaimStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'FOR_REVIEW',
    'REVIEWED',
    'COORDINATED_WITH_PCIC',
    'REQUIRES_CORRECTION'
);


ALTER TYPE public."ClaimStatus" OWNER TO agrivista_user;

--
-- Name: InventoryCategory; Type: TYPE; Schema: public; Owner: agrivista_user
--

CREATE TYPE public."InventoryCategory" AS ENUM (
    'SEEDS',
    'FERTILIZER'
);


ALTER TYPE public."InventoryCategory" OWNER TO agrivista_user;

--
-- Name: PriorityLevel; Type: TYPE; Schema: public; Owner: agrivista_user
--

CREATE TYPE public."PriorityLevel" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."PriorityLevel" OWNER TO agrivista_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: agrivista_user
--

CREATE TYPE public."Role" AS ENUM (
    'OMAG_HEAD',
    'OMAG_STAFF'
);


ALTER TYPE public."Role" OWNER TO agrivista_user;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: agrivista_user
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'VERIFIED',
    'PARTIALLY_VERIFIED',
    'NOT_VERIFIED',
    'METADATA_MISSING',
    'REQUIRES_REVIEW'
);


ALTER TYPE public."VerificationStatus" OWNER TO agrivista_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    "roleSnapshot" text,
    action text NOT NULL,
    module text NOT NULL,
    "recordId" text,
    "previousValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO agrivista_user;

--
-- Name: ClaimPriorityScore; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."ClaimPriorityScore" (
    id text NOT NULL,
    "claimId" text NOT NULL,
    score double precision NOT NULL,
    "priorityLevel" public."PriorityLevel" NOT NULL,
    "rankPosition" integer,
    "formulaBreakdown" jsonb NOT NULL,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClaimPriorityScore" OWNER TO agrivista_user;

--
-- Name: Crop; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."Crop" (
    id integer NOT NULL,
    "parcelId" integer NOT NULL,
    "cropType" text NOT NULL,
    variety text,
    category text DEFAULT 'Primary'::text NOT NULL,
    "plantedAreaHa" double precision NOT NULL,
    "plantingDate" timestamp(3) without time zone NOT NULL,
    "expectedHarvestDate" timestamp(3) without time zone,
    season text NOT NULL,
    year integer NOT NULL,
    "historicalYieldTons" double precision,
    status text DEFAULT 'Standing'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualHarvestDate" timestamp(3) without time zone,
    "harvestedAreaHa" double precision,
    "productionQuantity" double precision,
    "productionUnit" text,
    "recordedYieldPerHa" double precision,
    remarks text
);


ALTER TABLE public."Crop" OWNER TO agrivista_user;

--
-- Name: CropPrediction; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."CropPrediction" (
    id text NOT NULL,
    "reportId" integer NOT NULL,
    "cropId" integer NOT NULL,
    "modelId" text,
    "projectedNormalYieldTons" double precision NOT NULL,
    "predictedRemainingYieldTons" double precision NOT NULL,
    "predictedYieldReductionPercent" double precision NOT NULL,
    "estimatedEconomicLossPhp" double precision NOT NULL,
    "inputFeaturesSnapshot" jsonb NOT NULL,
    "predictionTimestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CropPrediction" OWNER TO agrivista_user;

--
-- Name: Crop_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."Crop_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Crop_id_seq" OWNER TO agrivista_user;

--
-- Name: Crop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."Crop_id_seq" OWNED BY public."Crop".id;


--
-- Name: DamageAssessment; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."DamageAssessment" (
    id text NOT NULL,
    "reportId" integer NOT NULL,
    "assessedDamagePercent" double precision NOT NULL,
    "assessedAreaHa" double precision NOT NULL,
    "cropStage" text NOT NULL,
    "assessorNotes" text,
    "assessedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DamageAssessment" OWNER TO agrivista_user;

--
-- Name: DamagePhoto; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."DamagePhoto" (
    id text NOT NULL,
    "reportId" integer NOT NULL,
    "storageProvider" text DEFAULT 'LOCAL'::text NOT NULL,
    "bucketName" text DEFAULT 'agrivista-damage-photos'::text NOT NULL,
    "storageKey" text NOT NULL,
    "originalFileName" text NOT NULL,
    "fileSizeBytes" integer NOT NULL,
    "mimeType" text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DamagePhoto" OWNER TO agrivista_user;

--
-- Name: DamageReport; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."DamageReport" (
    id integer NOT NULL,
    "reportNumber" text NOT NULL,
    "farmerId" integer NOT NULL,
    "parcelId" integer NOT NULL,
    "cropId" integer NOT NULL,
    "incidentDate" timestamp(3) without time zone NOT NULL,
    "calamityType" text NOT NULL,
    "reportedDamagePercent" double precision NOT NULL,
    "reportedAffectedAreaHa" double precision NOT NULL,
    "narrativeDescription" text,
    status public."ClaimStatus" DEFAULT 'SUBMITTED'::public."ClaimStatus" NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DamageReport" OWNER TO agrivista_user;

--
-- Name: DamageReport_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."DamageReport_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DamageReport_id_seq" OWNER TO agrivista_user;

--
-- Name: DamageReport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."DamageReport_id_seq" OWNED BY public."DamageReport".id;


--
-- Name: DistributionRecord; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."DistributionRecord" (
    id text NOT NULL,
    "batchId" text NOT NULL,
    "farmerId" integer NOT NULL,
    "quantityDistributed" double precision NOT NULL,
    unit text NOT NULL,
    "distributionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "releasedById" text NOT NULL,
    purpose text,
    remarks text
);


ALTER TABLE public."DistributionRecord" OWNER TO agrivista_user;

--
-- Name: Farm; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."Farm" (
    id integer NOT NULL,
    "farmerId" integer NOT NULL,
    "totalAreaHa" double precision NOT NULL,
    "waterSource" text DEFAULT 'Rainfed'::text NOT NULL,
    "isCalamityAffected" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    barangay text NOT NULL,
    "farmName" text,
    latitude double precision,
    longitude double precision,
    municipality text DEFAULT 'Polomolok'::text NOT NULL,
    province text DEFAULT 'South Cotabato'::text NOT NULL,
    "soilType" text,
    "tenureType" text DEFAULT 'Owned'::text NOT NULL,
    "farmCode" text,
    remarks text,
    "sitioPurok" text
);


ALTER TABLE public."Farm" OWNER TO agrivista_user;

--
-- Name: FarmParcel; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."FarmParcel" (
    id integer NOT NULL,
    "farmId" integer NOT NULL,
    "parcelNumber" text NOT NULL,
    latitude double precision,
    longitude double precision,
    "areaHa" double precision NOT NULL,
    "boundaryCoordinates" jsonb,
    status text DEFAULT 'Active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "parcelCode" text,
    remarks text,
    "soilType" text
);


ALTER TABLE public."FarmParcel" OWNER TO agrivista_user;

--
-- Name: FarmParcel_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."FarmParcel_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FarmParcel_id_seq" OWNER TO agrivista_user;

--
-- Name: FarmParcel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."FarmParcel_id_seq" OWNED BY public."FarmParcel".id;


--
-- Name: Farm_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."Farm_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Farm_id_seq" OWNER TO agrivista_user;

--
-- Name: Farm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."Farm_id_seq" OWNED BY public."Farm".id;


--
-- Name: Farmer; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."Farmer" (
    id integer NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    barangay text NOT NULL,
    municipality text DEFAULT 'Polomolok'::text NOT NULL,
    province text DEFAULT 'South Cotabato'::text NOT NULL,
    "isSenior" boolean DEFAULT false NOT NULL,
    "isPwd" boolean DEFAULT false NOT NULL,
    is4ps boolean DEFAULT false NOT NULL,
    "isIp" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "civilStatus" text,
    "contactNumber" text,
    "dateOfBirth" timestamp(3) without time zone NOT NULL,
    "extensionName" text,
    "middleName" text,
    "rsbsaNumber" text,
    sex text NOT NULL,
    email text,
    "farmerCode" text
);


ALTER TABLE public."Farmer" OWNER TO agrivista_user;

--
-- Name: Farmer_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."Farmer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Farmer_id_seq" OWNER TO agrivista_user;

--
-- Name: Farmer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."Farmer_id_seq" OWNED BY public."Farmer".id;


--
-- Name: HistoricalAgriculturalData; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."HistoricalAgriculturalData" (
    id integer NOT NULL,
    barangay text NOT NULL,
    year integer NOT NULL,
    season text NOT NULL,
    "cropType" text NOT NULL,
    "plantedAreaHa" double precision NOT NULL,
    "harvestedAreaHa" double precision NOT NULL,
    "productionTons" double precision NOT NULL,
    "averageYieldTonsHa" double precision NOT NULL,
    "seedUsageKg" double precision,
    "fertilizerUsageBags" double precision,
    "soilType" text,
    "calamityOccurrences" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."HistoricalAgriculturalData" OWNER TO agrivista_user;

--
-- Name: HistoricalAgriculturalData_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."HistoricalAgriculturalData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."HistoricalAgriculturalData_id_seq" OWNER TO agrivista_user;

--
-- Name: HistoricalAgriculturalData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."HistoricalAgriculturalData_id_seq" OWNED BY public."HistoricalAgriculturalData".id;


--
-- Name: InventoryBatch; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."InventoryBatch" (
    id text NOT NULL,
    "itemId" integer NOT NULL,
    "batchNumber" text NOT NULL,
    "receivedQuantity" double precision NOT NULL,
    "remainingQuantity" double precision NOT NULL,
    "dateReceived" timestamp(3) without time zone NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    "viabilityDate" timestamp(3) without time zone,
    "supplierSource" text,
    "storageLocation" text,
    status text DEFAULT 'Available'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InventoryBatch" OWNER TO agrivista_user;

--
-- Name: InventoryItem; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."InventoryItem" (
    id integer NOT NULL,
    "itemCode" text NOT NULL,
    name text NOT NULL,
    category public."InventoryCategory" NOT NULL,
    unit text NOT NULL,
    "reorderLevel" double precision DEFAULT 10.0 NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InventoryItem" OWNER TO agrivista_user;

--
-- Name: InventoryItem_id_seq; Type: SEQUENCE; Schema: public; Owner: agrivista_user
--

CREATE SEQUENCE public."InventoryItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InventoryItem_id_seq" OWNER TO agrivista_user;

--
-- Name: InventoryItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agrivista_user
--

ALTER SEQUENCE public."InventoryItem_id_seq" OWNED BY public."InventoryItem".id;


--
-- Name: LandDocument; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."LandDocument" (
    id text NOT NULL,
    "farmerId" integer NOT NULL,
    "farmId" integer,
    "documentType" text NOT NULL,
    "storageProvider" text DEFAULT 'LOCAL'::text NOT NULL,
    "bucketName" text DEFAULT 'agrivista-documents'::text NOT NULL,
    "storageKey" text NOT NULL,
    "fileName" text NOT NULL,
    "fileFormat" text NOT NULL,
    "fileSizeBytes" integer NOT NULL,
    "uploadedById" text NOT NULL,
    "verificationStatus" text DEFAULT 'Pending'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LandDocument" OWNER TO agrivista_user;

--
-- Name: MetadataVerification; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."MetadataVerification" (
    id text NOT NULL,
    "metadataId" text NOT NULL,
    "parcelId" integer NOT NULL,
    "calculatedDistanceMeters" double precision,
    "acceptableThresholdMeters" double precision DEFAULT 500.0 NOT NULL,
    "timestampDifferenceHours" double precision,
    status public."VerificationStatus" DEFAULT 'REQUIRES_REVIEW'::public."VerificationStatus" NOT NULL,
    "verificationNotes" text,
    "verifiedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MetadataVerification" OWNER TO agrivista_user;

--
-- Name: MlModelRegistry; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."MlModelRegistry" (
    id text NOT NULL,
    "modelName" text NOT NULL,
    "modelVersion" text NOT NULL,
    "targetVariable" text NOT NULL,
    algorithm text NOT NULL,
    "trainingPeriod" text NOT NULL,
    mae double precision NOT NULL,
    rmse double precision NOT NULL,
    "r2Score" double precision NOT NULL,
    "featuresUsed" text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MlModelRegistry" OWNER TO agrivista_user;

--
-- Name: PcicClaim; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."PcicClaim" (
    id text NOT NULL,
    "claimNumber" text NOT NULL,
    "reportId" integer NOT NULL,
    "claimStatus" public."ClaimStatus" DEFAULT 'SUBMITTED'::public."ClaimStatus" NOT NULL,
    "insurancePolicyNo" text,
    "filingDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text
);


ALTER TABLE public."PcicClaim" OWNER TO agrivista_user;

--
-- Name: PhotoMetadata; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."PhotoMetadata" (
    id text NOT NULL,
    "photoId" text NOT NULL,
    "hasExif" boolean DEFAULT false NOT NULL,
    latitude double precision,
    longitude double precision,
    altitude double precision,
    "capturedDate" timestamp(3) without time zone,
    "deviceMake" text,
    "deviceModel" text,
    "rawExifData" jsonb
);


ALTER TABLE public."PhotoMetadata" OWNER TO agrivista_user;

--
-- Name: PhotoVerification; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."PhotoVerification" (
    id text NOT NULL,
    "farmerId" integer NOT NULL,
    "farmId" integer NOT NULL,
    "parcelId" integer NOT NULL,
    "storageProvider" text DEFAULT 'LOCAL'::text NOT NULL,
    "bucketName" text DEFAULT 'agrivista-verifications'::text NOT NULL,
    "storageKey" text NOT NULL,
    "originalFileName" text NOT NULL,
    "fileSizeBytes" integer NOT NULL,
    "mimeType" text NOT NULL,
    "photoTimestamp" timestamp(3) without time zone,
    "photoLatitude" double precision,
    "photoLongitude" double precision,
    "photoAltitude" double precision,
    "deviceMake" text,
    "deviceModel" text,
    "registeredLatitude" double precision,
    "registeredLongitude" double precision,
    "calculatedDistanceMeters" double precision,
    "thresholdMeters" double precision DEFAULT 500.0 NOT NULL,
    "verificationStatus" text NOT NULL,
    "gpsStatus" text NOT NULL,
    "timestampStatus" text NOT NULL,
    "failureReasonCode" text,
    "verificationNotes" text,
    "metadataJson" jsonb,
    "verifiedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PhotoVerification" OWNER TO agrivista_user;

--
-- Name: ResourceDemandForecast; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."ResourceDemandForecast" (
    id text NOT NULL,
    barangay text NOT NULL,
    "cropType" text NOT NULL,
    "forecastYear" integer NOT NULL,
    "forecastSeason" text NOT NULL,
    "projectedAreaHa" double precision NOT NULL,
    "forecastSeedKg" double precision NOT NULL,
    "forecastFertilizerBags" double precision NOT NULL,
    "methodUsed" text NOT NULL,
    "confidenceMetric" double precision,
    "limitationsNotice" text NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ResourceDemandForecast" OWNER TO agrivista_user;

--
-- Name: User; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "fullName" text NOT NULL,
    role public."Role" DEFAULT 'OMAG_STAFF'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO agrivista_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: agrivista_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO agrivista_user;

--
-- Name: Crop id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Crop" ALTER COLUMN id SET DEFAULT nextval('public."Crop_id_seq"'::regclass);


--
-- Name: DamageReport id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageReport" ALTER COLUMN id SET DEFAULT nextval('public."DamageReport_id_seq"'::regclass);


--
-- Name: Farm id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Farm" ALTER COLUMN id SET DEFAULT nextval('public."Farm_id_seq"'::regclass);


--
-- Name: FarmParcel id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."FarmParcel" ALTER COLUMN id SET DEFAULT nextval('public."FarmParcel_id_seq"'::regclass);


--
-- Name: Farmer id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Farmer" ALTER COLUMN id SET DEFAULT nextval('public."Farmer_id_seq"'::regclass);


--
-- Name: HistoricalAgriculturalData id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."HistoricalAgriculturalData" ALTER COLUMN id SET DEFAULT nextval('public."HistoricalAgriculturalData_id_seq"'::regclass);


--
-- Name: InventoryItem id; Type: DEFAULT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."InventoryItem" ALTER COLUMN id SET DEFAULT nextval('public."InventoryItem_id_seq"'::regclass);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."AuditLog" (id, "userId", "roleSnapshot", action, module, "recordId", "previousValues", "newValues", "ipAddress", "timestamp") FROM stdin;
c14c0067-e55e-4d46-8a08-a6742c79efa9	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	CREATE	PCIC	2	\N	{"calamityType": "Typhoon", "reportNumber": "DR-2026-9186", "damagePercent": 65}	::1	2026-09-03 13:10:12.215
675e395e-ba67-43dd-9460-cf6e55d73c7a	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	PREDICT	PCIC	1b426a93-22c5-4dc7-803c-a2465fe884d6	\N	{"cropType": "Rice", "reportId": 2, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "estimatedEconomicLossPhp": 112320, "predictedRemainingYieldTons": 2.52, "predictedYieldReductionPercent": 65}	::1	2026-09-03 13:10:20.198
ca53c856-caac-4d21-b997-b284c61eb010	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	VERIFY	PCIC	d50be029-0c18-4bb8-8bf6-5adae0808444	\N	{"notes": "EXIF GPS coordinates are missing from the photograph. Staff physical review required.", "status": "METADATA_MISSING", "photoId": "aea831ef-90fd-4de1-b680-97a4201e612f", "parcelId": 3, "distanceMeters": null}	::1	2026-09-03 13:10:38.411
c1ee4eb6-b98e-48a5-84b3-4128c4c3ee81	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	DELETE	PCIC	aea831ef-90fd-4de1-b680-97a4201e612f	{"fileName": "hris.png", "reportId": 2, "reportNumber": "DR-2026-9186"}	\N	::1	2026-09-03 13:11:17.658
3834641d-4f3b-427d-8b45-94d05d3290da	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	VERIFY	PCIC	b19de95a-b6bc-4a49-835e-7c1848adcf6c	\N	{"notes": "EXIF GPS coordinates are missing from the photograph. Staff physical review required.", "status": "METADATA_MISSING", "photoId": "c907b804-d4d8-4539-830f-34dcad5c4ae3", "parcelId": 3, "distanceMeters": null}	::1	2026-09-03 13:14:35.345
85cb6448-a48a-4e3d-869e-7a44ca0851ba	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	DELETE	PCIC	c907b804-d4d8-4539-830f-34dcad5c4ae3	{"fileName": "map.png", "reportId": 2, "reportNumber": "DR-2026-9186"}	\N	::1	2026-09-03 13:15:22.425
f6cca4b7-2e9b-428d-8d94-338927ffe87d	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	PREDICT	HISTORICAL	4de4b9aa-c200-46a7-a5f1-fdbbc6c814b1	\N	{"source": "LOCAL_BENCHMARK_FALLBACK", "barangay": "Cannery Site", "cropType": "Corn", "forecastYear": 2026, "forecastSeason": "Wet", "forecastSeedKg": 2688, "projectedAreaHa": 120, "forecastFertilizerBags": 940.8}	::1	2026-09-03 13:17:58.753
8c6f22f2-aa06-4c48-a395-ec2e34d8552f	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	CREATE	RSBSA	4	\N	{"name": "kirby jay geldore", "barangay": "Poblacion", "rsbsaNumber": "12-63-12-763-781953"}	::1	2026-09-03 13:23:02.026
2a770730-a815-4900-9a84-77be6b067122	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	CREATE	PCIC	3	\N	{"calamityType": "Flood", "reportNumber": "DR-2026-9305", "damagePercent": 70}	::1	2026-09-03 13:27:10.591
03e2500e-0d0f-4067-a9bf-4fafdef41745	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	UPDATE	PCIC	5306d4e8-e68f-429a-993c-610a97030b48	\N	{"reportId": 3, "cropStage": "Vegetative", "docketStatus": "COORDINATED_WITH_PCIC", "assessedAreaHa": 1.45, "assessedDamagePercent": 70, "computedEconomicLossPhp": 812160}	::1	2026-09-03 13:28:57.053
3e58ac05-60c7-4978-845e-7c69dac6cd9e	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	PREDICT	PCIC	5f9c1e16-0c5a-4d01-a52e-451def5214a7	\N	{"cropType": "Pineapple", "reportId": 3, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "estimatedEconomicLossPhp": 812160, "predictedRemainingYieldTons": 10.87, "predictedYieldReductionPercent": 70}	::1	2026-09-03 13:29:05.099
f5a568db-5997-4ac1-8e0b-8b778b5f2252	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_STAFF	UPDATE	RSBSA	7	{"status": "Active"}	{"status": "Archived"}	\N	2026-09-05 01:44:32.845
74a50c15-9ea0-4065-9d0c-4b61c99a29bd	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_STAFF	UPDATE	RSBSA	7	{"farmCode": "FC-STEP2-001"}	{"farmCode": "FC-S2-UPDATED", "sitioPurok": "Purok Pag-asa"}	\N	2026-09-05 01:44:32.893
0ac5b937-df4c-4bda-96e4-5db833d981c2	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_STAFF	UPDATE	RSBSA	7	{"status": "Standing"}	{"status": "Harvested", "yieldPerHa": 4.25, "productionQuantity": 8.5}	\N	2026-09-05 01:44:32.933
eee547ab-fb2b-4a65-9512-077d781707f3	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	UPDATE	RSBSA	8	{"farmName": "Temporary Test Farm", "soilType": "Clay Loam", "totalAreaHa": 3.5}	{"farmName": "Polomolok Valley Test Farm", "soilType": "Sandy Loam", "totalAreaHa": 4.25}	\N	2026-09-05 02:47:46.388
ac9d85bd-7f7f-4056-b10b-5228c3143997	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	UPDATE	RSBSA	8	{"latitude": null, "longitude": null}	{"latitude": 6.224512, "longitude": 125.066789}	\N	2026-09-05 02:47:46.422
893c5c6d-b501-4d8c-9db6-3d7d7b13c32b	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	UPDATE	RSBSA	8	{"status": "Standing"}	{"status": "Harvested", "productionUnit": "Metric Tons", "productionQuantity": 8.5, "recordedYieldPerHa": 4.25}	\N	2026-09-05 02:47:46.463
340e2d52-f2f8-43b7-9686-34772eed2f48	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	VERIFY	RSBSA	c707639d-86b8-49c3-920a-f9648e20865e	\N	{"farmId": 3, "farmerId": 3, "parcelId": 3, "gpsStatus": "GPS_MISSING", "distanceMeters": null, "thresholdMeters": 500, "timestampStatus": "TIMESTAMP_MISSING", "originalFileName": "map.png", "verificationStatus": "METADATA_MISSING", "photoVerificationId": "c707639d-86b8-49c3-920a-f9648e20865e"}	::1	2026-09-05 03:44:36.762
528a7dff-cf29-4e4b-b186-0871d3ed48ad	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	CREATE_FARMER	RSBSA	12	null	{"id": 12, "name": "AutomatedTest FarmerRecord", "barangay": "Poblacion", "rsbsaNumber": "12-63-12-TEST-999999"}	\N	2026-09-09 13:16:10.807
5edc0522-90f2-40cc-bdf3-b81a3044f7c7	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	UPDATE_FARMER	RSBSA	12	{"barangay": "Poblacion", "lastName": "FarmerRecord", "firstName": "AutomatedTest", "rsbsaNumber": "12-63-12-TEST-999999", "contactNumber": "0918-000-1122"}	{"barangay": "Poblacion", "lastName": "FarmerRecord", "firstName": "AutomatedTest", "rsbsaNumber": "12-63-12-TEST-999999", "contactNumber": "0919-999-8877"}	\N	2026-09-09 13:16:11.084
3066a17c-0769-4887-9c1a-d505bc87c6a0	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	CREATE_FARM_PARCEL	RSBSA	10	null	{"areaHa": 2.5, "farmId": 10, "barangay": "Poblacion", "farmerId": 12, "parcelNumber": "LOT-TEST-AUTO-01"}	\N	2026-09-09 13:16:11.192
209a7c72-cb43-4888-b45b-c24e0ced44f8	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	RECORD_CROP	RSBSA	10	null	{"year": 2026, "cropId": 10, "season": "Dry", "cropType": "Corn", "parcelId": 10, "plantedAreaHa": 2.5}	\N	2026-09-09 13:16:11.261
1cd71697-f5c5-4ae4-9bdb-ffdf2c4255af	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	UPLOAD_DOCUMENT	RSBSA	9cdee445-848f-4a22-bf59-69f2128ad507	null	{"farmerId": 12, "fileName": "TCT_123456_Poblacion.pdf", "documentId": "9cdee445-848f-4a22-bf59-69f2128ad507", "documentType": "Land Title"}	\N	2026-09-09 13:16:11.34
78318e90-0c0f-4f26-b7c4-49bccf410a71	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	CREATE_FARMER	RSBSA	13	null	{"id": 13, "name": "AutomatedTest FarmerRecord", "barangay": "Poblacion", "rsbsaNumber": "12-63-12-TEST-999999"}	\N	2026-09-09 13:25:31.396
0a156a69-e340-45e5-84f1-bcb91f4f573b	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	PREDICT	RSBSA	simulation	\N	{"cropId": null, "farmId": null, "cropType": "Rice", "farmerId": null, "parcelId": null, "yieldUnit": "PENDING OMAG CONFIRMATION — STANDARD YIELD UNIT", "plantedAreaHa": 3, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "predictionStatus": "DEVELOPMENT / SYNTHETIC TEST MODE", "economicLossStatus": "OFFICIAL_APPROVED_PRICE", "projectedNormalYield": 12, "assessedDamagePercent": 50, "predictedRemainingYield": 6, "estimatedEconomicLossPhp": 144000, "predictedRemainingYieldTons": 6, "predictedYieldReductionPercent": 50}	::1	2026-09-05 04:57:58.104
f1f5e265-ab56-40cf-b85a-509309cac056	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	PREDICT	RSBSA	simulation	\N	{"cropId": null, "farmId": null, "cropType": "Pineapple", "farmerId": null, "parcelId": null, "yieldUnit": "PENDING OMAG CONFIRMATION — STANDARD YIELD UNIT", "plantedAreaHa": 1.5, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "predictionStatus": "DEVELOPMENT / SYNTHETIC TEST MODE", "economicLossStatus": "PENDING APPROVED PRICE SOURCE (DEMO ESTIMATE ONLY)", "projectedNormalYield": 37.5, "assessedDamagePercent": 20, "predictedRemainingYield": 30, "estimatedEconomicLossPhp": 240000, "predictedRemainingYieldTons": 30, "predictedYieldReductionPercent": 20}	::1	2026-09-05 04:57:58.241
5b64f5d0-e798-4cf5-bcb6-a21c8880f62c	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	PREDICT	RSBSA	simulation	\N	{"cropId": null, "farmId": null, "cropType": "Rice", "farmerId": null, "parcelId": null, "yieldUnit": "PENDING OMAG CONFIRMATION — STANDARD YIELD UNIT", "plantedAreaHa": 3, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "predictionStatus": "DEVELOPMENT / SYNTHETIC TEST MODE", "economicLossStatus": "OFFICIAL_APPROVED_PRICE", "projectedNormalYield": 12, "assessedDamagePercent": 50, "predictedRemainingYield": 6, "estimatedEconomicLossPhp": 144000, "predictedRemainingYieldTons": 6, "predictedYieldReductionPercent": 50}	::1	2026-09-05 05:01:27.506
fa0dc303-0196-4d19-b918-48ea123dd73e	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	PREDICT	RSBSA	simulation	\N	{"cropId": null, "farmId": null, "cropType": "Pineapple", "farmerId": null, "parcelId": null, "yieldUnit": "PENDING OMAG CONFIRMATION — STANDARD YIELD UNIT", "plantedAreaHa": 1.5, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "predictionStatus": "DEVELOPMENT / SYNTHETIC TEST MODE", "economicLossStatus": "PENDING APPROVED PRICE SOURCE (DEMO ESTIMATE ONLY)", "projectedNormalYield": 37.5, "assessedDamagePercent": 20, "predictedRemainingYield": 30, "estimatedEconomicLossPhp": 240000, "predictedRemainingYieldTons": 30, "predictedYieldReductionPercent": 20}	::1	2026-09-05 05:01:27.823
357df2db-c9b8-4b72-91c7-590dba38cb13	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	DISTRIBUTE	INVENTORY	7315c71f-1447-4859-bd54-f0dee51660ba	\N	{"unit": "kg", "itemId": 3, "purpose": "Test Municipal FIFO Seed Subsidy", "farmerId": 1, "itemName": "Test Hybrid Yellow Corn Seed", "farmerName": "Tan, Roberto", "batchesAllocated": [{"quantity": 100, "batchNumber": "TEST-BATCH-01", "remainingAfter": 0}, {"quantity": 20, "batchNumber": "TEST-BATCH-02", "remainingAfter": 130}], "totalQuantityDistributed": 120}	\N	2026-09-07 12:09:18.863
2e4ac80c-4e7d-4a21-9eb6-8b2bfceffb6d	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	DISTRIBUTE	INVENTORY	1e3d43ef-1f14-4443-931f-ae55c0321eee	\N	{"unit": "kg", "itemId": 9, "purpose": "Test Municipal FIFO Seed Subsidy", "farmerId": 1, "itemName": "Test Hybrid Yellow Corn Seed", "farmerName": "Tan, Roberto", "batchesAllocated": [{"quantity": 100, "batchNumber": "TEST-BATCH-01", "remainingAfter": 0}, {"quantity": 20, "batchNumber": "TEST-BATCH-02", "remainingAfter": 130}], "totalQuantityDistributed": 120}	\N	2026-09-07 12:54:31.291
afebaba6-e223-4589-bedd-9449dd087fe1	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	PREDICT	RSBSA	simulation	\N	{"cropId": null, "farmId": null, "cropType": "Rice", "farmerId": null, "parcelId": null, "yieldUnit": "PENDING OMAG CONFIRMATION — STANDARD YIELD UNIT", "plantedAreaHa": 3, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "predictionStatus": "DEVELOPMENT / SYNTHETIC TEST MODE", "economicLossStatus": "OFFICIAL_APPROVED_PRICE", "projectedNormalYield": 12, "assessedDamagePercent": 50, "predictedRemainingYield": 6, "estimatedEconomicLossPhp": 144000, "predictedRemainingYieldTons": 6, "predictedYieldReductionPercent": 50}	::1	2026-09-07 13:00:00.77
4b5bb769-cc97-4f44-99de-e7790e90a3dc	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	OMAG_HEAD	PREDICT	RSBSA	simulation	\N	{"cropId": null, "farmId": null, "cropType": "Pineapple", "farmerId": null, "parcelId": null, "yieldUnit": "PENDING OMAG CONFIRMATION — STANDARD YIELD UNIT", "plantedAreaHa": 1.5, "inferenceSource": "LOCAL_BENCHMARK_FALLBACK", "predictionStatus": "DEVELOPMENT / SYNTHETIC TEST MODE", "economicLossStatus": "PENDING APPROVED PRICE SOURCE (DEMO ESTIMATE ONLY)", "projectedNormalYield": 37.5, "assessedDamagePercent": 20, "predictedRemainingYield": 30, "estimatedEconomicLossPhp": 240000, "predictedRemainingYieldTons": 30, "predictedYieldReductionPercent": 20}	::1	2026-09-07 13:00:01.459
72f2adee-8c5b-4ea1-8ea4-3c8ef1ba8379	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	UPDATE_FARMER	RSBSA	13	{"barangay": "Poblacion", "lastName": "FarmerRecord", "firstName": "AutomatedTest", "rsbsaNumber": "12-63-12-TEST-999999", "contactNumber": "0918-000-1122"}	{"barangay": "Poblacion", "lastName": "FarmerRecord", "firstName": "AutomatedTest", "rsbsaNumber": "12-63-12-TEST-999999", "contactNumber": "0919-999-8877"}	\N	2026-09-09 13:25:31.528
90ce3987-8f62-4e2f-b90f-555ec9ef112c	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	CREATE_FARM_PARCEL	RSBSA	11	null	{"areaHa": 2.5, "farmId": 11, "barangay": "Poblacion", "farmerId": 13, "parcelNumber": "LOT-TEST-AUTO-01"}	\N	2026-09-09 13:25:31.615
7dd574e1-b3a4-4f3e-8d21-1c654c5aa683	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	RECORD_CROP	RSBSA	11	null	{"year": 2026, "cropId": 11, "season": "Dry", "cropType": "Corn", "parcelId": 11, "plantedAreaHa": 2.5}	\N	2026-09-09 13:25:31.683
1825a975-3dd7-410d-8e8a-1675646124fe	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	UPLOAD_DOCUMENT	RSBSA	7ea70980-6863-40da-a35e-3fbb0e7e6bae	null	{"farmerId": 13, "fileName": "TCT_123456_Poblacion.pdf", "documentId": "7ea70980-6863-40da-a35e-3fbb0e7e6bae", "documentType": "Land Title"}	\N	2026-09-09 13:25:31.947
099c1c62-ff32-44f8-a903-ff31586de23c	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	CREATE_FARMER	RSBSA	14	null	{"id": 14, "name": "AutomatedTest FarmerRecord", "barangay": "Poblacion", "rsbsaNumber": "12-63-12-TEST-999999"}	\N	2026-09-09 13:52:25.575
6f633b19-62d9-4630-adbe-d2d0649e6905	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	UPDATE_FARMER	RSBSA	14	{"barangay": "Poblacion", "lastName": "FarmerRecord", "firstName": "AutomatedTest", "rsbsaNumber": "12-63-12-TEST-999999", "contactNumber": "0918-000-1122"}	{"barangay": "Poblacion", "lastName": "FarmerRecord", "firstName": "AutomatedTest", "rsbsaNumber": "12-63-12-TEST-999999", "contactNumber": "0919-999-8877"}	\N	2026-09-09 13:52:25.631
f51c2f3f-98f6-4a4f-ac73-c832b25d3d72	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	CREATE_FARM_PARCEL	RSBSA	12	null	{"areaHa": 2.5, "farmId": 12, "barangay": "Poblacion", "farmerId": 14, "parcelNumber": "LOT-TEST-AUTO-01"}	\N	2026-09-09 13:52:25.667
3c31a1f4-fce6-4750-b700-31188ec3f32d	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	RECORD_CROP	RSBSA	12	null	{"year": 2026, "cropId": 12, "season": "Dry", "cropType": "Corn", "parcelId": 12, "plantedAreaHa": 2.5}	\N	2026-09-09 13:52:25.684
c741f08a-dc4d-41a6-80d1-6ef915812823	41d4d357-b6f9-49f6-abe3-4b3e0628a54a	OMAG_STAFF	UPLOAD_DOCUMENT	RSBSA	f1f07e7e-8f25-4253-8727-33c7cdd758af	null	{"farmerId": 14, "fileName": "TCT_123456_Poblacion.pdf", "documentId": "f1f07e7e-8f25-4253-8727-33c7cdd758af", "documentType": "Land Title"}	\N	2026-09-09 13:52:25.701
\.


--
-- Data for Name: ClaimPriorityScore; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."ClaimPriorityScore" (id, "claimId", score, "priorityLevel", "rankPosition", "formulaBreakdown", "calculatedAt") FROM stdin;
1838dcbb-3e79-4545-a308-0c4a8a9403c3	aa4bcd55-02cf-4ff9-8394-3e69b7d07078	74	HIGH	2	{"areaScore": 18, "stageScore": 10, "totalScore": 74, "damageScore": 26, "formulaNote": "Deterministic Multi-Criteria Weighted Prioritization (Damage 40% + Area 25% + Hazard 20% + CropStage 15%).", "growthStage": "Vegetative", "hazardScore": 20, "calamityType": "Typhoon", "priorityLevel": "HIGH", "affectedAreaHa": 1.8, "damagePercentUsed": 65}	2026-09-05 03:46:23.253
7c039c52-b387-40e9-a77f-7ebec18dcb86	772ad7b9-125c-4533-a92c-65cdf9033652	70.5	HIGH	3	{"areaScore": 14.5, "stageScore": 10, "totalScore": 70.5, "damageScore": 28, "formulaNote": "Deterministic Multi-Criteria Weighted Prioritization (Damage 40% + Area 25% + Hazard 20% + CropStage 15%).", "growthStage": "Vegetative", "hazardScore": 18, "calamityType": "Flood", "priorityLevel": "HIGH", "affectedAreaHa": 1.45, "damagePercentUsed": 70}	2026-09-05 03:46:23.671
106db279-ff7d-4919-bd8d-68f92882237b	3facd82b-f392-4d47-85d9-b48895ca83fa	74	HIGH	1	{"areaScore": 18, "stageScore": 10, "totalScore": 74, "damageScore": 26, "formulaNote": "Deterministic Multi-Criteria Weighted Prioritization (Damage 40% + Area 25% + Hazard 20% + CropStage 15%).", "growthStage": "Vegetative", "hazardScore": 20, "calamityType": "Typhoon", "priorityLevel": "HIGH", "affectedAreaHa": 1.8, "damagePercentUsed": 65}	2026-09-05 03:46:22.608
\.


--
-- Data for Name: Crop; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."Crop" (id, "parcelId", "cropType", variety, category, "plantedAreaHa", "plantingDate", "expectedHarvestDate", season, year, "historicalYieldTons", status, "createdAt", "updatedAt", "actualHarvestDate", "harvestedAreaHa", "productionQuantity", "productionUnit", "recordedYieldPerHa", remarks) FROM stdin;
1	1	Corn	NK8840	Primary	2.5	2026-01-15 00:00:00	2026-05-15 00:00:00	Dry	2026	\N	Standing	2026-09-02 16:03:04.724	2026-09-02 16:03:04.724	\N	\N	\N	\N	\N	\N
2	2	Pineapple	MD-2 Hybrid	Primary	3.2	2026-01-15 00:00:00	2026-05-15 00:00:00	Wet	2026	\N	Standing	2026-09-02 16:03:04.77	2026-09-02 16:03:04.77	\N	\N	\N	\N	\N	\N
3	3	Rice	RC222	Primary	1.8	2026-01-15 00:00:00	2026-05-15 00:00:00	Wet	2026	\N	Standing	2026-09-02 16:03:04.782	2026-09-02 16:03:04.782	\N	\N	\N	\N	\N	\N
4	4	Pineapple	NK8840	Primary	2	2026-09-03 00:00:00	\N	Wet	2026	\N	Standing	2026-09-03 13:23:02.012	2026-09-03 13:23:02.012	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: CropPrediction; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."CropPrediction" (id, "reportId", "cropId", "modelId", "projectedNormalYieldTons", "predictedRemainingYieldTons", "predictedYieldReductionPercent", "estimatedEconomicLossPhp", "inputFeaturesSnapshot", "predictionTimestamp") FROM stdin;
1b426a93-22c5-4dc7-803c-a2465fe884d6	2	3	\N	7.2	2.52	65	112320	{"mae": 1.5, "rmse": 2.6, "source": "LOCAL_BENCHMARK_FALLBACK", "r2Score": 0.95, "cropType": "Rice", "modelName": "polomolok-benchmark-heuristic-v1", "growthStage": "Vegetative", "calamityType": "Typhoon", "plantedAreaHa": 1.8, "assessedDamagePercent": 65}	2026-09-03 13:10:20.171
5f9c1e16-0c5a-4d01-a52e-451def5214a7	3	4	\N	36.25	10.87	70	812160	{"mae": 1.5, "rmse": 2.6, "source": "LOCAL_BENCHMARK_FALLBACK", "r2Score": 0.95, "cropType": "Pineapple", "modelName": "polomolok-benchmark-heuristic-v1", "growthStage": "Vegetative", "calamityType": "Flood", "plantedAreaHa": 1.45, "assessedDamagePercent": 70}	2026-09-03 13:29:04.962
\.


--
-- Data for Name: DamageAssessment; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."DamageAssessment" (id, "reportId", "assessedDamagePercent", "assessedAreaHa", "cropStage", "assessorNotes", "assessedAt") FROM stdin;
5306d4e8-e68f-429a-993c-610a97030b48	3	70	1.45	Vegetative	[Assessor: Engr. Maria Santos (Municipal Agriculturist)] [Recovery Potential: Low] [Est. Loss: 25.38 tons / PHP 812,160] replanting pineapple	2026-09-03 13:28:57.018
\.


--
-- Data for Name: DamagePhoto; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."DamagePhoto" (id, "reportId", "storageProvider", "bucketName", "storageKey", "originalFileName", "fileSizeBytes", "mimeType", "uploadedAt") FROM stdin;
097cdd43-3a93-4769-9bfb-ebdd82a0097c	1	LOCAL	agrivista-damage-photos	damage-photos/report-1/sample-field-lodging.jpg	IMG_20260828_091522_Lodging.jpg	2458900	image/jpeg	2026-09-02 16:24:51.14
\.


--
-- Data for Name: DamageReport; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."DamageReport" (id, "reportNumber", "farmerId", "parcelId", "cropId", "incidentDate", "calamityType", "reportedDamagePercent", "reportedAffectedAreaHa", "narrativeDescription", status, "createdById", "createdAt", "updatedAt") FROM stdin;
1	DR-2026-0001	1	1	1	2026-08-28 09:00:00	Typhoon	65	1.8	Severe stalk lodging and waterlogging caused by heavy rainfall and gusty winds associated with Habagat monsoonal rains. Estimated 65% crop yield impairment on parcel centroid.	REVIEWED	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	2026-09-02 16:24:51.113	2026-09-02 16:24:51.113
2	DR-2026-9186	3	3	3	2026-09-03 00:00:00	Typhoon	65	1.8		SUBMITTED	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	2026-09-03 13:10:12.168	2026-09-03 13:10:12.168
3	DR-2026-9305	4	4	4	2026-09-03 00:00:00	Flood	70	1.45	malaki yung damage ng pineapple na tinanim namin malaki ang lugi namin nito	COORDINATED_WITH_PCIC	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	2026-09-03 13:27:10.575	2026-09-03 13:28:57.034
\.


--
-- Data for Name: DistributionRecord; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."DistributionRecord" (id, "batchId", "farmerId", "quantityDistributed", unit, "distributionDate", "releasedById", purpose, remarks) FROM stdin;
\.


--
-- Data for Name: Farm; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."Farm" (id, "farmerId", "totalAreaHa", "waterSource", "isCalamityAffected", status, "createdAt", "updatedAt", barangay, "farmName", latitude, longitude, municipality, province, "soilType", "tenureType", "farmCode", remarks, "sitioPurok") FROM stdin;
1	1	2.5	Rainfed	f	Active	2026-09-02 16:03:04.724	2026-09-02 16:03:04.724	Poblacion	Tan Family Agro Farm	\N	\N	Polomolok	South Cotabato	Clay Loam	Owned	\N	\N	\N
2	2	3.2	Rainfed	f	Active	2026-09-02 16:03:04.77	2026-09-02 16:03:04.77	Cannery Site	Reyes High-Yield Farm	\N	\N	Polomolok	South Cotabato	Volcanic Loam	Owned	\N	\N	\N
3	3	1.8	Rainfed	f	Active	2026-09-02 16:03:04.782	2026-09-02 16:03:04.782	Silway 8	Silway Green Paddy	\N	\N	Polomolok	South Cotabato	Silty Clay Loam	Leased	\N	\N	\N
4	4	4	Rainfed	f	Active	2026-09-03 13:23:01.994	2026-09-03 13:23:01.994	Poblacion	Carp	\N	\N	Polomolok	South Cotabato	Clay Loam	Owned	\N	\N	\N
\.


--
-- Data for Name: FarmParcel; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."FarmParcel" (id, "farmId", "parcelNumber", latitude, longitude, "areaHa", "boundaryCoordinates", status, "createdAt", "updatedAt", "parcelCode", remarks, "soilType") FROM stdin;
1	1	LOT-POB-01	6.2189	125.0645	2.5	\N	Active	2026-09-02 16:03:04.724	2026-09-02 16:03:04.724	\N	\N	\N
2	2	LOT-CAN-01	6.2372	125.0789	3.2	\N	Active	2026-09-02 16:03:04.77	2026-09-02 16:03:04.77	\N	\N	\N
3	3	LOT-SIL-01	6.195	125.102	1.8	\N	Active	2026-09-02 16:03:04.782	2026-09-02 16:03:04.782	\N	\N	\N
4	4	LOT-01	6.2239	125.0653	2	\N	Active	2026-09-03 13:23:02.003	2026-09-03 13:23:02.003	\N	\N	\N
\.


--
-- Data for Name: Farmer; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."Farmer" (id, "firstName", "lastName", barangay, municipality, province, "isSenior", "isPwd", is4ps, "isIp", status, "createdAt", "updatedAt", "civilStatus", "contactNumber", "dateOfBirth", "extensionName", "middleName", "rsbsaNumber", sex, email, "farmerCode") FROM stdin;
1	Roberto	Tan	Poblacion	Polomolok	South Cotabato	f	f	f	f	Active	2026-09-02 16:03:04.724	2026-09-02 16:03:04.724	Married	09171234567	1968-04-12 00:00:00	\N	Mendoza	12-63-12-001-000001	Male	\N	\N
2	Elena	Reyes	Cannery Site	Polomolok	South Cotabato	t	f	t	f	Active	2026-09-02 16:03:04.77	2026-09-02 16:03:04.77	Widowed	09289876543	1959-08-23 00:00:00	\N	Gomez	12-63-12-002-000002	Female	\N	\N
3	Danilo	Flores	Silway 8	Polomolok	South Cotabato	f	f	f	t	Active	2026-09-02 16:03:04.782	2026-09-02 16:03:04.782	Married	09395551234	1975-11-05 00:00:00	\N	Bautista	12-63-12-003-000003	Male	\N	\N
4	kirby jay	geldore	Poblacion	Polomolok	South Cotabato	f	f	t	f	Active	2026-09-03 13:23:01.983	2026-09-03 13:23:01.983	Single	09361102342	2003-05-17 00:00:00		servidad	12-63-12-763-781953	Male	\N	\N
\.


--
-- Data for Name: HistoricalAgriculturalData; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."HistoricalAgriculturalData" (id, barangay, year, season, "cropType", "plantedAreaHa", "harvestedAreaHa", "productionTons", "averageYieldTonsHa", "seedUsageKg", "fertilizerUsageBags", "soilType", "calamityOccurrences", "createdAt") FROM stdin;
1	Poblacion	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:03:04.826
2	Cannery Site	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:03:04.837
3	Silway 8	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:03:04.841
4	Magsaysay	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:03:04.845
5	Bentung	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:03:04.847
6	Poblacion	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:23:40.76
7	Cannery Site	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:23:40.783
8	Silway 8	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:23:40.786
9	Magsaysay	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:23:40.79
10	Bentung	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:23:40.794
11	Poblacion	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:24:51.067
12	Cannery Site	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:24:51.075
13	Silway 8	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:24:51.079
14	Magsaysay	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:24:51.082
15	Bentung	2025	Wet	Corn	120	115	494.5	4.3	2400	600	Clay Loam	0	2026-09-02 16:24:51.085
\.


--
-- Data for Name: InventoryBatch; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."InventoryBatch" (id, "itemId", "batchNumber", "receivedQuantity", "remainingQuantity", "dateReceived", "expiryDate", "viabilityDate", "supplierSource", "storageLocation", status, "createdAt", "updatedAt") FROM stdin;
a9cbde83-4695-4101-997d-6977ace664ee	1	BATCH-2026-CORN-01	100	100	2026-01-05 00:00:00	\N	2026-12-31 00:00:00	DA Region XII Seed Center	Warehouse A - Bay 1	Available	2026-09-02 16:03:04.795	2026-09-02 16:03:04.795
11e38960-1a52-43fb-aef4-8aa5820288b2	1	BATCH-2026-CORN-02	150	150	2026-02-10 00:00:00	\N	2027-02-10 00:00:00	DA Region XII Seed Center	Warehouse A - Bay 2	Available	2026-09-02 16:03:04.795	2026-09-02 16:03:04.795
110fca70-db2a-472e-9b44-a6592d4959ad	2	BATCH-2026-UREA-01	60	60	2026-01-10 00:00:00	2028-01-10 00:00:00	\N	LGU Polomolok Procurement	Warehouse B - Section 1	Available	2026-09-02 16:03:04.819	2026-09-02 16:03:04.819
\.


--
-- Data for Name: InventoryItem; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."InventoryItem" (id, "itemCode", name, category, unit, "reorderLevel", description, "isActive", "createdAt", "updatedAt") FROM stdin;
1	SEED-CORN-HYB	Hybrid Yellow Corn Seeds (NK8840)	SEEDS	kg	50	High-yield hybrid yellow corn seeds for Polomolok plains.	t	2026-09-02 16:03:04.795	2026-09-02 16:03:04.795
2	FERT-UREA-4600	Urea Fertilizer (46-0-0)	FERTILIZER	bags	25	Standard municipal nitrogenous fertilizer supplement.	t	2026-09-02 16:03:04.819	2026-09-02 16:03:04.819
\.


--
-- Data for Name: LandDocument; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."LandDocument" (id, "farmerId", "farmId", "documentType", "storageProvider", "bucketName", "storageKey", "fileName", "fileFormat", "fileSizeBytes", "uploadedById", "verificationStatus", remarks, "createdAt") FROM stdin;
\.


--
-- Data for Name: MetadataVerification; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."MetadataVerification" (id, "metadataId", "parcelId", "calculatedDistanceMeters", "acceptableThresholdMeters", "timestampDifferenceHours", status, "verificationNotes", "verifiedAt") FROM stdin;
06b59eaf-84fc-426f-9b27-07358a5ea32d	c4a3d681-cb64-4df5-a13a-56e52eb469b7	1	98.6	500	0.25	VERIFIED	GPS location verified within 98.6m of registered parcel centroid (Threshold: 500m). Timestamp is consistent (captured 15 minutes following reported incident).	2026-09-02 16:24:51.163
\.


--
-- Data for Name: MlModelRegistry; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."MlModelRegistry" (id, "modelName", "modelVersion", "targetVariable", algorithm, "trainingPeriod", mae, rmse, "r2Score", "featuresUsed", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: PcicClaim; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."PcicClaim" (id, "claimNumber", "reportId", "claimStatus", "insurancePolicyNo", "filingDate", remarks, "reviewedAt", "reviewedBy") FROM stdin;
3facd82b-f392-4d47-85d9-b48895ca83fa	CLM-2026-0001	1	SUBMITTED	\N	2026-09-03 13:24:46.536	\N	\N	\N
aa4bcd55-02cf-4ff9-8394-3e69b7d07078	CLM-2026-0002	2	SUBMITTED	\N	2026-09-03 13:24:46.768	\N	\N	\N
772ad7b9-125c-4533-a92c-65cdf9033652	CLM-2026-0003	3	SUBMITTED	\N	2026-09-03 15:42:15.145	\N	\N	\N
\.


--
-- Data for Name: PhotoMetadata; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."PhotoMetadata" (id, "photoId", "hasExif", latitude, longitude, altitude, "capturedDate", "deviceMake", "deviceModel", "rawExifData") FROM stdin;
c4a3d681-cb64-4df5-a13a-56e52eb469b7	097cdd43-3a93-4769-9bfb-ebdd82a0097c	t	6.2197	125.0649	195.4	2026-08-28 09:15:22	Samsung	SM-G991B (Galaxy S21 5G)	{"ISO": 50, "Make": "Samsung", "Model": "SM-G991B", "FNumber": 1.8, "Software": "G991BXXU9EVL3", "ExposureTime": 0.002}
\.


--
-- Data for Name: PhotoVerification; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."PhotoVerification" (id, "farmerId", "farmId", "parcelId", "storageProvider", "bucketName", "storageKey", "originalFileName", "fileSizeBytes", "mimeType", "photoTimestamp", "photoLatitude", "photoLongitude", "photoAltitude", "deviceMake", "deviceModel", "registeredLatitude", "registeredLongitude", "calculatedDistanceMeters", "thresholdMeters", "verificationStatus", "gpsStatus", "timestampStatus", "failureReasonCode", "verificationNotes", "metadataJson", "verifiedById", "createdAt", "updatedAt") FROM stdin;
c707639d-86b8-49c3-920a-f9648e20865e	3	3	3	LOCAL	agrivista-verifications	photo-verifications/farmer-3/parcel-3/59736fe5-608b-441d-903f-773562e479a2.png	map.png	103303	image/png	\N	\N	\N	\N	\N	\N	6.195	125.102	\N	500	METADATA_MISSING	GPS_MISSING	TIMESTAMP_MISSING	EXIF_STRIPPED_OR_MISSING	Photograph contains no embedded EXIF metadata (often stripped by social media / messaging apps or web uploaders). Physical ocular inspection required.	null	4a2e9eb8-1c72-42ec-845c-81b7b8657c89	2026-09-05 03:44:36.542	2026-09-05 03:44:36.542
\.


--
-- Data for Name: ResourceDemandForecast; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."ResourceDemandForecast" (id, barangay, "cropType", "forecastYear", "forecastSeason", "projectedAreaHa", "forecastSeedKg", "forecastFertilizerBags", "methodUsed", "confidenceMetric", "limitationsNotice", "generatedAt") FROM stdin;
4de4b9aa-c200-46a7-a5f1-fdbbc6c814b1	Cannery Site	Corn	2026	Wet	120	2688	940.8	Deterministic Benchmark Heuristic (FastAPI Fallback)	0.975	DECISION SUPPORT ESTIMATE ONLY — NOT AN OFFICIAL MUNICIPAL PROCUREMENT ORDER. Forecasts reflect Random Forest multi-target regression calibrated with synthetic historical agronomic data for Polomolok.	2026-09-03 13:17:58.7
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public."User" (id, username, email, "passwordHash", "fullName", role, "isActive", "createdAt", "updatedAt") FROM stdin;
4a2e9eb8-1c72-42ec-845c-81b7b8657c89	head.polomolok	head@polomolok.gov.ph	$2b$10$t8wQ5I7qAjNrdbNzH2.GcuVjm2iWUJYt3Fi/cx0UyKVurybqrJO6m	Engr. Maria Santos	OMAG_HEAD	t	2026-09-02 16:03:04.675	2026-09-02 16:03:04.675
41d4d357-b6f9-49f6-abe3-4b3e0628a54a	staff.polomolok	staff@polomolok.gov.ph	$2b$10$t8wQ5I7qAjNrdbNzH2.GcuVjm2iWUJYt3Fi/cx0UyKVurybqrJO6m	Juan Dela Cruz	OMAG_STAFF	t	2026-09-02 16:03:04.702	2026-09-02 16:03:04.702
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: agrivista_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3964e75a-d61e-4867-b8ea-eda1a6fac8fa	9d381ef51c4c78f99d4582186dc8879ec66894722d81aafa9cf52600e94774a8	2026-09-02 23:17:25.931206+08	20260902151725_init	\N	\N	2026-09-02 23:17:25.703292+08	1
bbcb5eef-9c69-4d69-802f-4f2cd5b9143f	1d403eee5ca2f030b97808271af2810241c6a95aee5e3de3fd1993e98126a7ee	2026-09-05 19:49:36.124807+08	20260905000000_complete_schema	\N	\N	2026-09-05 19:49:35.886224+08	1
\.


--
-- Name: Crop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."Crop_id_seq"', 12, true);


--
-- Name: DamageReport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."DamageReport_id_seq"', 3, true);


--
-- Name: FarmParcel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."FarmParcel_id_seq"', 12, true);


--
-- Name: Farm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."Farm_id_seq"', 12, true);


--
-- Name: Farmer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."Farmer_id_seq"', 14, true);


--
-- Name: HistoricalAgriculturalData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."HistoricalAgriculturalData_id_seq"', 15, true);


--
-- Name: InventoryItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agrivista_user
--

SELECT pg_catalog.setval('public."InventoryItem_id_seq"', 14, true);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ClaimPriorityScore ClaimPriorityScore_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."ClaimPriorityScore"
    ADD CONSTRAINT "ClaimPriorityScore_pkey" PRIMARY KEY (id);


--
-- Name: CropPrediction CropPrediction_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."CropPrediction"
    ADD CONSTRAINT "CropPrediction_pkey" PRIMARY KEY (id);


--
-- Name: Crop Crop_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Crop"
    ADD CONSTRAINT "Crop_pkey" PRIMARY KEY (id);


--
-- Name: DamageAssessment DamageAssessment_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageAssessment"
    ADD CONSTRAINT "DamageAssessment_pkey" PRIMARY KEY (id);


--
-- Name: DamagePhoto DamagePhoto_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamagePhoto"
    ADD CONSTRAINT "DamagePhoto_pkey" PRIMARY KEY (id);


--
-- Name: DamageReport DamageReport_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageReport"
    ADD CONSTRAINT "DamageReport_pkey" PRIMARY KEY (id);


--
-- Name: DistributionRecord DistributionRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DistributionRecord"
    ADD CONSTRAINT "DistributionRecord_pkey" PRIMARY KEY (id);


--
-- Name: FarmParcel FarmParcel_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."FarmParcel"
    ADD CONSTRAINT "FarmParcel_pkey" PRIMARY KEY (id);


--
-- Name: Farm Farm_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Farm"
    ADD CONSTRAINT "Farm_pkey" PRIMARY KEY (id);


--
-- Name: Farmer Farmer_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Farmer"
    ADD CONSTRAINT "Farmer_pkey" PRIMARY KEY (id);


--
-- Name: HistoricalAgriculturalData HistoricalAgriculturalData_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."HistoricalAgriculturalData"
    ADD CONSTRAINT "HistoricalAgriculturalData_pkey" PRIMARY KEY (id);


--
-- Name: InventoryBatch InventoryBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."InventoryBatch"
    ADD CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY (id);


--
-- Name: InventoryItem InventoryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_pkey" PRIMARY KEY (id);


--
-- Name: LandDocument LandDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."LandDocument"
    ADD CONSTRAINT "LandDocument_pkey" PRIMARY KEY (id);


--
-- Name: MetadataVerification MetadataVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."MetadataVerification"
    ADD CONSTRAINT "MetadataVerification_pkey" PRIMARY KEY (id);


--
-- Name: MlModelRegistry MlModelRegistry_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."MlModelRegistry"
    ADD CONSTRAINT "MlModelRegistry_pkey" PRIMARY KEY (id);


--
-- Name: PcicClaim PcicClaim_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PcicClaim"
    ADD CONSTRAINT "PcicClaim_pkey" PRIMARY KEY (id);


--
-- Name: PhotoMetadata PhotoMetadata_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoMetadata"
    ADD CONSTRAINT "PhotoMetadata_pkey" PRIMARY KEY (id);


--
-- Name: PhotoVerification PhotoVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoVerification"
    ADD CONSTRAINT "PhotoVerification_pkey" PRIMARY KEY (id);


--
-- Name: ResourceDemandForecast ResourceDemandForecast_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."ResourceDemandForecast"
    ADD CONSTRAINT "ResourceDemandForecast_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_module_action_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "AuditLog_module_action_idx" ON public."AuditLog" USING btree (module, action);


--
-- Name: AuditLog_timestamp_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "AuditLog_timestamp_idx" ON public."AuditLog" USING btree ("timestamp" DESC);


--
-- Name: ClaimPriorityScore_claimId_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "ClaimPriorityScore_claimId_key" ON public."ClaimPriorityScore" USING btree ("claimId");


--
-- Name: ClaimPriorityScore_priorityLevel_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "ClaimPriorityScore_priorityLevel_idx" ON public."ClaimPriorityScore" USING btree ("priorityLevel");


--
-- Name: ClaimPriorityScore_score_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "ClaimPriorityScore_score_idx" ON public."ClaimPriorityScore" USING btree (score DESC);


--
-- Name: CropPrediction_reportId_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "CropPrediction_reportId_key" ON public."CropPrediction" USING btree ("reportId");


--
-- Name: Crop_cropType_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "Crop_cropType_idx" ON public."Crop" USING btree ("cropType");


--
-- Name: Crop_parcelId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "Crop_parcelId_idx" ON public."Crop" USING btree ("parcelId");


--
-- Name: DamageAssessment_reportId_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "DamageAssessment_reportId_key" ON public."DamageAssessment" USING btree ("reportId");


--
-- Name: DamagePhoto_reportId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DamagePhoto_reportId_idx" ON public."DamagePhoto" USING btree ("reportId");


--
-- Name: DamageReport_farmerId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DamageReport_farmerId_idx" ON public."DamageReport" USING btree ("farmerId");


--
-- Name: DamageReport_incidentDate_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DamageReport_incidentDate_idx" ON public."DamageReport" USING btree ("incidentDate");


--
-- Name: DamageReport_parcelId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DamageReport_parcelId_idx" ON public."DamageReport" USING btree ("parcelId");


--
-- Name: DamageReport_reportNumber_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "DamageReport_reportNumber_key" ON public."DamageReport" USING btree ("reportNumber");


--
-- Name: DistributionRecord_batchId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DistributionRecord_batchId_idx" ON public."DistributionRecord" USING btree ("batchId");


--
-- Name: DistributionRecord_distributionDate_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DistributionRecord_distributionDate_idx" ON public."DistributionRecord" USING btree ("distributionDate");


--
-- Name: DistributionRecord_farmerId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "DistributionRecord_farmerId_idx" ON public."DistributionRecord" USING btree ("farmerId");


--
-- Name: FarmParcel_farmId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "FarmParcel_farmId_idx" ON public."FarmParcel" USING btree ("farmId");


--
-- Name: FarmParcel_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "FarmParcel_latitude_longitude_idx" ON public."FarmParcel" USING btree (latitude, longitude);


--
-- Name: Farm_barangay_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "Farm_barangay_idx" ON public."Farm" USING btree (barangay);


--
-- Name: Farm_farmerId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "Farm_farmerId_idx" ON public."Farm" USING btree ("farmerId");


--
-- Name: Farmer_barangay_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "Farmer_barangay_idx" ON public."Farmer" USING btree (barangay);


--
-- Name: Farmer_lastName_firstName_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "Farmer_lastName_firstName_idx" ON public."Farmer" USING btree ("lastName", "firstName");


--
-- Name: Farmer_rsbsaNumber_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "Farmer_rsbsaNumber_key" ON public."Farmer" USING btree ("rsbsaNumber");


--
-- Name: HistoricalAgriculturalData_barangay_cropType_year_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "HistoricalAgriculturalData_barangay_cropType_year_idx" ON public."HistoricalAgriculturalData" USING btree (barangay, "cropType", year);


--
-- Name: InventoryBatch_dateReceived_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "InventoryBatch_dateReceived_idx" ON public."InventoryBatch" USING btree ("dateReceived");


--
-- Name: InventoryBatch_itemId_remainingQuantity_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "InventoryBatch_itemId_remainingQuantity_idx" ON public."InventoryBatch" USING btree ("itemId", "remainingQuantity");


--
-- Name: InventoryItem_itemCode_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON public."InventoryItem" USING btree ("itemCode");


--
-- Name: LandDocument_farmerId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "LandDocument_farmerId_idx" ON public."LandDocument" USING btree ("farmerId");


--
-- Name: MetadataVerification_metadataId_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "MetadataVerification_metadataId_key" ON public."MetadataVerification" USING btree ("metadataId");


--
-- Name: MetadataVerification_status_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "MetadataVerification_status_idx" ON public."MetadataVerification" USING btree (status);


--
-- Name: MlModelRegistry_modelName_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "MlModelRegistry_modelName_key" ON public."MlModelRegistry" USING btree ("modelName");


--
-- Name: PcicClaim_claimNumber_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "PcicClaim_claimNumber_key" ON public."PcicClaim" USING btree ("claimNumber");


--
-- Name: PcicClaim_claimStatus_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "PcicClaim_claimStatus_idx" ON public."PcicClaim" USING btree ("claimStatus");


--
-- Name: PcicClaim_reportId_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "PcicClaim_reportId_key" ON public."PcicClaim" USING btree ("reportId");


--
-- Name: PhotoMetadata_photoId_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "PhotoMetadata_photoId_key" ON public."PhotoMetadata" USING btree ("photoId");


--
-- Name: PhotoVerification_createdAt_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "PhotoVerification_createdAt_idx" ON public."PhotoVerification" USING btree ("createdAt" DESC);


--
-- Name: PhotoVerification_farmId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "PhotoVerification_farmId_idx" ON public."PhotoVerification" USING btree ("farmId");


--
-- Name: PhotoVerification_farmerId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "PhotoVerification_farmerId_idx" ON public."PhotoVerification" USING btree ("farmerId");


--
-- Name: PhotoVerification_parcelId_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "PhotoVerification_parcelId_idx" ON public."PhotoVerification" USING btree ("parcelId");


--
-- Name: PhotoVerification_verificationStatus_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "PhotoVerification_verificationStatus_idx" ON public."PhotoVerification" USING btree ("verificationStatus");


--
-- Name: ResourceDemandForecast_barangay_forecastYear_idx; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE INDEX "ResourceDemandForecast_barangay_forecastYear_idx" ON public."ResourceDemandForecast" USING btree (barangay, "forecastYear");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: agrivista_user
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClaimPriorityScore ClaimPriorityScore_claimId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."ClaimPriorityScore"
    ADD CONSTRAINT "ClaimPriorityScore_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES public."PcicClaim"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CropPrediction CropPrediction_cropId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."CropPrediction"
    ADD CONSTRAINT "CropPrediction_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES public."Crop"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CropPrediction CropPrediction_modelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."CropPrediction"
    ADD CONSTRAINT "CropPrediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES public."MlModelRegistry"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CropPrediction CropPrediction_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."CropPrediction"
    ADD CONSTRAINT "CropPrediction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."DamageReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Crop Crop_parcelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Crop"
    ADD CONSTRAINT "Crop_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES public."FarmParcel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DamageAssessment DamageAssessment_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageAssessment"
    ADD CONSTRAINT "DamageAssessment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."DamageReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DamagePhoto DamagePhoto_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamagePhoto"
    ADD CONSTRAINT "DamagePhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."DamageReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DamageReport DamageReport_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageReport"
    ADD CONSTRAINT "DamageReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DamageReport DamageReport_cropId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageReport"
    ADD CONSTRAINT "DamageReport_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES public."Crop"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DamageReport DamageReport_farmerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageReport"
    ADD CONSTRAINT "DamageReport_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES public."Farmer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DamageReport DamageReport_parcelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DamageReport"
    ADD CONSTRAINT "DamageReport_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES public."FarmParcel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DistributionRecord DistributionRecord_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DistributionRecord"
    ADD CONSTRAINT "DistributionRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."InventoryBatch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DistributionRecord DistributionRecord_farmerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DistributionRecord"
    ADD CONSTRAINT "DistributionRecord_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES public."Farmer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DistributionRecord DistributionRecord_releasedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."DistributionRecord"
    ADD CONSTRAINT "DistributionRecord_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FarmParcel FarmParcel_farmId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."FarmParcel"
    ADD CONSTRAINT "FarmParcel_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES public."Farm"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Farm Farm_farmerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."Farm"
    ADD CONSTRAINT "Farm_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES public."Farmer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InventoryBatch InventoryBatch_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."InventoryBatch"
    ADD CONSTRAINT "InventoryBatch_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public."InventoryItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LandDocument LandDocument_farmId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."LandDocument"
    ADD CONSTRAINT "LandDocument_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES public."Farm"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LandDocument LandDocument_farmerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."LandDocument"
    ADD CONSTRAINT "LandDocument_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES public."Farmer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LandDocument LandDocument_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."LandDocument"
    ADD CONSTRAINT "LandDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MetadataVerification MetadataVerification_metadataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."MetadataVerification"
    ADD CONSTRAINT "MetadataVerification_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES public."PhotoMetadata"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MetadataVerification MetadataVerification_parcelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."MetadataVerification"
    ADD CONSTRAINT "MetadataVerification_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES public."FarmParcel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PcicClaim PcicClaim_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PcicClaim"
    ADD CONSTRAINT "PcicClaim_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."DamageReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PhotoMetadata PhotoMetadata_photoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoMetadata"
    ADD CONSTRAINT "PhotoMetadata_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES public."DamagePhoto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PhotoVerification PhotoVerification_farmId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoVerification"
    ADD CONSTRAINT "PhotoVerification_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES public."Farm"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PhotoVerification PhotoVerification_farmerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoVerification"
    ADD CONSTRAINT "PhotoVerification_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES public."Farmer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PhotoVerification PhotoVerification_parcelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoVerification"
    ADD CONSTRAINT "PhotoVerification_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES public."FarmParcel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PhotoVerification PhotoVerification_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agrivista_user
--

ALTER TABLE ONLY public."PhotoVerification"
    ADD CONSTRAINT "PhotoVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO agrivista_user;


--
-- PostgreSQL database dump complete
--

\unrestrict uLVdLhhbp3bevZpKuik7iRU4kaIXYmvrgCR4uohK6I7wO16NSUYcQuy1jUpFD3V

