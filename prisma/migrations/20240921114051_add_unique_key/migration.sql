/*
  Warnings:

  - A unique constraint covering the columns `[title,homepageAddress]` on the table `Culture` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Culture_title_homepageAddress_key" ON "Culture"("title", "homepageAddress");
