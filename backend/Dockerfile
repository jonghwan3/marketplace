FROM golang:1.23 as builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main .

FROM debian:bookworm-slim

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]