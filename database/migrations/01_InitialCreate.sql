CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "Email" text NOT NULL,
    "PasswordHash" text NOT NULL,
    "FullName" text NOT NULL,
    "AvatarUrl" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "Credits" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Balance" integer NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Credits" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Credits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "CreditTransactions" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Amount" integer NOT NULL,
    "Type" integer NOT NULL,
    "Description" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_CreditTransactions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CreditTransactions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Projects" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Description" text,
    "AspectRatio" integer NOT NULL,
    "Style" integer NOT NULL,
    "TargetDuration" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Projects" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Projects_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Characters" (
    "Id" uuid NOT NULL,
    "ProjectId" uuid NOT NULL,
    "Name" text NOT NULL,
    "Age" integer,
    "Gender" text,
    "Appearance" text,
    "Clothing" text,
    "VoiceDescription" text,
    "ReferenceImagesJson" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Characters" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Characters_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Exports" (
    "Id" uuid NOT NULL,
    "ProjectId" uuid NOT NULL,
    "FinalVideoUrl" text NOT NULL,
    "Resolution" text NOT NULL,
    "FileSizeBytes" bigint NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Exports" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Exports_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Scripts" (
    "Id" uuid NOT NULL,
    "ProjectId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Genre" text,
    "Logline" text,
    "FullText" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Scripts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Scripts_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Storyboards" (
    "Id" uuid NOT NULL,
    "ProjectId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Summary" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Storyboards" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Storyboards_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Scenes" (
    "Id" uuid NOT NULL,
    "ProjectId" uuid NOT NULL,
    "CharacterId" uuid,
    "SceneNumber" integer NOT NULL,
    "Duration" double precision NOT NULL,
    "Prompt" text NOT NULL,
    "CameraMovement" text,
    "LightingStyle" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Scenes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Scenes_Characters_CharacterId" FOREIGN KEY ("CharacterId") REFERENCES "Characters" ("Id"),
    CONSTRAINT "FK_Scenes_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
);

CREATE TABLE "SceneGenerations" (
    "Id" uuid NOT NULL,
    "SceneId" uuid NOT NULL,
    "VeoOperationId" text,
    "Status" integer NOT NULL,
    "VideoUrl" text,
    "PreviewUrl" text,
    "ErrorMessage" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SceneGenerations" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SceneGenerations_Scenes_SceneId" FOREIGN KEY ("SceneId") REFERENCES "Scenes" ("Id") ON DELETE CASCADE
);

CREATE TABLE "VideoJobs" (
    "Id" uuid NOT NULL,
    "GenerationId" uuid NOT NULL,
    "JobType" text NOT NULL,
    "Status" integer NOT NULL,
    "ProgressPercentage" integer NOT NULL,
    "ErrorMessage" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_VideoJobs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VideoJobs_SceneGenerations_GenerationId" FOREIGN KEY ("GenerationId") REFERENCES "SceneGenerations" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Characters_ProjectId" ON "Characters" ("ProjectId");

CREATE UNIQUE INDEX "IX_Credits_UserId" ON "Credits" ("UserId");

CREATE INDEX "IX_CreditTransactions_UserId" ON "CreditTransactions" ("UserId");

CREATE INDEX "IX_Exports_ProjectId" ON "Exports" ("ProjectId");

CREATE INDEX "IX_Projects_UserId" ON "Projects" ("UserId");

CREATE INDEX "IX_SceneGenerations_SceneId" ON "SceneGenerations" ("SceneId");

CREATE INDEX "IX_Scenes_CharacterId" ON "Scenes" ("CharacterId");

CREATE INDEX "IX_Scenes_ProjectId" ON "Scenes" ("ProjectId");

CREATE INDEX "IX_Scripts_ProjectId" ON "Scripts" ("ProjectId");

CREATE INDEX "IX_Storyboards_ProjectId" ON "Storyboards" ("ProjectId");

CREATE INDEX "IX_VideoJobs_GenerationId" ON "VideoJobs" ("GenerationId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260810142445_InitialCreate', '9.0.2');

COMMIT;

