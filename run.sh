(cd frontend/admin && pnpm run build:fullstack)   # injects the <base> placeholder
(cd frontend/user  && pnpm run build)
rm -rf internal/web/dist && mkdir -p internal/web/dist
cp -r frontend/admin/dist internal/web/dist/admin
cp -r frontend/user/dist  internal/web/dist/user
go build -tags release,fullstack -o dujiao-next ./cmd/server