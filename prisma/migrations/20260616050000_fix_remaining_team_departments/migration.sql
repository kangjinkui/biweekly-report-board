UPDATE "Team"
SET "departmentName" = '공원녹지과'
WHERE "name" IN ('공원기획팀', '광원기획팀');

UPDATE "Team"
SET "departmentName" = '환경과'
WHERE "name" = '자연생태팀';

UPDATE "Team"
SET "departmentName" = '부동산정보과'
WHERE "name" = '지가조사팀';
