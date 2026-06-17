UPDATE "Team"
SET "departmentName" = '재건축사업과'
WHERE "name" LIKE '재건축%';

UPDATE "Team"
SET "departmentName" = '건축과'
WHERE "name" LIKE '건축%';

UPDATE "Team"
SET "departmentName" = '환경과'
WHERE "name" IN ('수질관리팀', '맑은대기팀', '녹색에너지팀')
   OR "name" LIKE '%환경%';

UPDATE "Team"
SET "departmentName" = '공원녹지과'
WHERE "name" LIKE '%공원%'
   OR "name" LIKE '%녹지%'
   OR "name" LIKE '%조경%';

UPDATE "Team"
SET "departmentName" = '주택과'
WHERE "name" LIKE '%주택%'
   OR "name" LIKE '%주거%';

UPDATE "Team"
SET "departmentName" = '부동산정보과'
WHERE "name" LIKE '%부동산%'
   OR "name" LIKE '%토지%'
   OR "name" LIKE '%지적%'
   OR "name" LIKE '%도로명%'
   OR "name" LIKE '%공간정보%';

UPDATE "Team"
SET "departmentName" = '도시계획과'
WHERE "name" IN ('도시계획팀', '도시정비팀', '지구단위팀', '광고물관리팀');
