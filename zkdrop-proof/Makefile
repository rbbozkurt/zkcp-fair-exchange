# Makefile for zkdrop-host project

# Variables
IMAGE_NAME := zkdrop-proof
TAG := latest
PLATFORM := linux/amd64
COMPOSE := docker-compose

# Targets
.PHONY: all build run stop restart logs clean rebuild \
        compose-build compose-up compose-down compose-restart

# Build Docker image using buildx
build:
	docker buildx build --platform=$(PLATFORM) -t $(IMAGE_NAME):$(TAG) .

# Run container directly
run:
	docker run --rm --platform=$(PLATFORM) -p 8095:8095 --env-file .env $(IMAGE_NAME):$(TAG)

# Stop container (safe fallback)
stop:
	docker stop $(IMAGE_NAME) || true

# Restart container (standalone run mode)
restart: stop run

# View logs
logs:
	docker logs -f $(IMAGE_NAME)

# Remove image
clean:
	docker rmi -f $(IMAGE_NAME):$(TAG) || true

# Rebuild image from scratch
rebuild: clean build

# Docker Compose build
compose-build:
	$(COMPOSE) build

# Docker Compose up (build + run)
compose-up:
	$(COMPOSE) up --build

# Docker Compose down
compose-down:
	$(COMPOSE) down

# Docker Compose restart
compose-restart:
	$(COMPOSE) down
	$(COMPOSE) up --build
