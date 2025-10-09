-- CreateTable
    CREATE TABLE "campaigns" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "messageBody" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "channels" TEXT[] NOT NULL,
        "totalContacts" INTEGER NOT NULL,
        "sentCount" INTEGER NOT NULL DEFAULT 0,
        "failedCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable
    CREATE TABLE "campaign_messages" (
        "id" TEXT NOT NULL,
        "campaignId" TEXT NOT NULL,
        "contactId" TEXT NOT NULL,
        "contactName" TEXT NOT NULL,
        "contactInfo" TEXT NOT NULL,
        "channel" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "providerId" TEXT,
        "error" TEXT,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id")
    );

    -- AddForeignKey
    ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;