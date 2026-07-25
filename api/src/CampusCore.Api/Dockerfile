# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copied and restored separately from the rest of the source so this layer
# stays cached across rebuilds unless the project file itself changes.
COPY CampusCore.Api.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# The base image's own default port; set explicitly so it isn't a silent
# implicit assumption if Microsoft changes the image default later.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "CampusCore.Api.dll"]
