package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type StorageService struct {
	client     *s3.Client
	bucketName string
}

// R2Config holds configuration for Cloudflare R2 storage
type R2Config struct {
	AccountID       string
	AccessKeyID     string
	AccessKeySecret string
	BucketName      string
}

func NewStorageService(cfg *R2Config) (*StorageService, error) {
	r2Resolver := aws.EndpointResolverWithOptionsFunc(
		func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			return aws.Endpoint{
				URL: fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID),
			}, nil
		},
	)

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithEndpointResolverWithOptions(r2Resolver),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				cfg.AccessKeyID,
				cfg.AccessKeySecret,
				"",
			),
		),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg)

	return &StorageService{
		client:     client,
		bucketName: cfg.BucketName,
	}, nil
}

func (s *StorageService) Upload(ctx context.Context, data []byte, fileName string, mimeType string, isEncrypted bool) (string, error) {
	// Generate a unique storage key
	extension := ""
	if dotIndex := strings.LastIndex(fileName, "."); dotIndex >= 0 {
		extension = fileName[dotIndex:]
	}

	storageKey := fmt.Sprintf(
		"%s/%s%s",
		time.Now().Format("2006/01/02"),
		uuid.New().String(),
		extension,
	)

	// Upload the file to R2
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(storageKey),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(mimeType),
		Metadata: map[string]string{
			"encrypted": fmt.Sprintf("%t", isEncrypted),
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload file to R2: %w", err)
	}

	return storageKey, nil
}

func (s *StorageService) Download(ctx context.Context, storageKey string) ([]byte, error) {
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(storageKey),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download file from R2: %w", err)
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

func (s *StorageService) Delete(ctx context.Context, storageKey string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(storageKey),
	})
	if err != nil {
		return fmt.Errorf("failed to delete file from R2: %w", err)
	}
	return nil
}

// GetSignedURL returns a pre-signed URL for direct file download
func (s *StorageService) GetSignedURL(ctx context.Context, storageKey string, expiry time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	presignResult, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(storageKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiry
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate pre-signed URL: %w", err)
	}

	return presignResult.URL, nil
}
