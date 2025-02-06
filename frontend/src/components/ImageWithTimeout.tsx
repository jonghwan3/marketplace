import React, { useEffect, useState } from "react";

type ImageWithTimeoutProps = {
  src: string;
  classes: string;
  alt?: string;
  timeoutDuration?: number; 
  className: string;
};

const getDefaultImage = (classes: string) => {
    switch (classes.toLowerCase()) {
      case "dog":
        return "/dog1.jpg"; 
      case "cat":
        return "/cat1.jpg"; 
      case "frog":
        return "/frog1.jpg";
      default:
        return "/dog1.jpg"; 
    }
  };

const ImageWithTimeout: React.FC<ImageWithTimeoutProps> = ({
  src,
  classes,
  alt,
  timeoutDuration = 5000,
  className = "item-image"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let timeoutId: NodeJS.Timeout;
    const loadImage = () => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        console.log('loading');
        clearTimeout(timeoutId); 
        setIsLoaded(true);
        setHasError(false);
      };

      img.onerror = () => {
        console.log(`Image loading failed. Retry attempt ${retryCount + 1}`);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          loadImage(); 
        } else {
          clearTimeout(timeoutId);
          setHasError(true);
          setIsLoaded(false);
        }
      };

      timeoutId = setTimeout(() => {
        console.log('Now waiting?');
        setHasError(true); 
        setIsLoaded(false);
      }, timeoutDuration);
    }

    loadImage();

    
    return () => {
      clearTimeout(timeoutId);
    };
    }, [src, timeoutDuration]);

  if (hasError) {
    return <img src={getDefaultImage(classes)} alt={alt} className={className}/>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>; 
  }

  return <img src={src} alt={alt} className={className} />;
};

export default ImageWithTimeout;
