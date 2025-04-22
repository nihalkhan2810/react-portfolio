import ASL1 from "../assets/projects/ASL1.png";
import ASL2 from "../assets/projects/ASL2.png";
import ASL3 from "../assets/projects/ASL3.png";
import FP1 from "../assets/projects/FP1.png";
import FP2 from "../assets/projects/FP2.png";
import FP3 from "../assets/projects/FP3.png";
import FP4 from "../assets/projects/FP4.png";
import BT1 from "../assets/projects/BT1.png";
import BT2 from "../assets/projects/BT2.png";
import BT3 from "../assets/projects/BT3.png";

export const HERO_CONTENT = `I'm an AI Engineer and Researcher with over 3 years of experience, driven by a fascination for how machines can learn and solve real-world problems. My journey into AI started with a deep curiosity, leading me to build scalable deep learning systems and practical AI solutions. I specialize in areas like computer vision (think things like CNNs and using tools like OpenCV) and machine learning (using powerful frameworks like PyTorch and TensorFlow). I also enjoy taking things from concept to reality, which is where my experience with cloud deployment on AWS and Kubernetes comes in. Ultimately, I love building end-to-end solutions that are not only technically robust but also efficient and easy for people to use. I'm also comfortable on the full-stack side, having built things using React and Flask.`;

export const ABOUT_TEXT = `I bring a practical approach to AI, combining technical expertise with a focus on solving real-world problems. My academic journey, with degrees from the University of Windsor (Master's in Electrical & Computer Engineering) and Sathyabama Institute (Bachelor's in Information Technology), has provided a strong base. My career is built on a fascination with machine learning and a desire to create intelligent systems that make a difference.
I specialize in computer vision, deep learning, and NLP, with hands-on experience in key tools like PyTorch and TensorFlow. I've also worked with Large Language Models (LLMs), fine-tuning and deploying them using Hugging Face and LangChain for applications like chatbots and document analysis. I'm also comfortable with full-stack development, having built projects like this website using React. I thrive in collaborative environments and am always looking for ways to contribute to innovative solutions while learning and growing.
Outside of work, I'm always keeping up with the latest in AI, contributing to open-source projects, and staying active through sports and fitness. My goal is to keep building cutting-edge technology that solves problems and makes a real impact.`;

export const EDUCATION = [
  {
    degree: "Masters of Engineering in Electrical and Computer Engineering",
    university: "University of Windsor",
    duration: "Sept 2023 - Dec 2024",
    location: "Windsor, Canada"
  },
  {
    degree: "Bachelor of Technology in Information Technology",
    university: "Sathyabama Institute of Science and Technology",
    duration: "June 2019 - May 2023",
    location: "Chennai, India"
  }
];

export const EXPERIENCES = [
  {
    year: "Dec 2021 - Jan 2023",
    role: "Research Assistant",
    company: "Sathyabama Institute",
    summary: "Developed a CNN-based pipeline for larvae identification and optimized real-time edge deployments.",
    description: [
      "Built a CNN-based pipeline in PyTorch for larvae identification, achieving an F1-score of 0.92 by fine-tuning pre-trained ResNet-34 models and integrating LLM-generated explanations for misclassification analysis.",
      "Automated image preprocessing workflows using OpenCV and Kubernetes, reducing inference latency from 200 ms to 140 ms for real-time edge deployments.",
      "Stored preprocessed data in AWS S3, achieving 99.8% uptime and reducing storage costs by 18% using parquet compression."
    ],
    technologies: ["PyTorch", "OpenCV", "Kubernetes", "AWS S3", "ResNet-34"]
  }
];

export const PROJECTS = [
  {
    title: "ASL Hand Gesture Analysis Using CNN",
    image: ASL1, // Thumbnail
    images: [ASL1, ASL2, ASL3], // Gallery images
    summary: "Trained a CNN to recognize ASL hand gestures with high accuracy on Raspberry Pi hardware.",
    details: [
      "Trained a TensorFlow-based CNN on 5000+ ASL images, achieving 98% test accuracy with <5 ms inference time on Raspberry Pi hardware.",
      "Reduced misclassification in low-light conditions by 15% using adaptive histogram equalization and synthetic data augmentation."
    ],
    technologies: ["TensorFlow", "Raspberry Pi", "Python"]
  },
  {
    title: "Fish-Species Identification Using Deep Learning",
    image: FP1, // Thumbnail
    images: [FP1, FP2, FP3, FP4], // Gallery images
    summary: "Designed a deep learning pipeline to classify fish species with high accuracy.",
    details: [
      "Designed a PySpark pipeline on AWS EMR to classify 20+ fish species, achieving 90% accuracy with a VGG-16 model trained on 1000+ images.",
      "Automated metadata tagging using BERT and stored results in Snowflake for collaborative analytics."
    ],
    technologies: ["PySpark", "AWS EMR", "VGG-16", "BERT", "Snowflake"]
  },
  {
    title: "Identification of Brain Tumor Using CNN",
    image: BT1, // Thumbnail
    images: [BT1, BT2, BT3], // Gallery images
    summary: "Built a CNN pipeline to classify MRI scans for brain tumor detection.",
    details: [
      "Designed a CNN-based pipeline using TensorFlow/Keras to classify MRI scans as malignant or non-malignant, achieving 92% accuracy with a custom ResNet-50 model trained on 5,000+ annotated scans.",
      "Enhanced image quality using Albumentations for data augmentation and OpenCV for preprocessing, improving model precision by 15% on low-resolution scans.",
      "Automated the pipeline with Flask for real-time tumor detection, achieving an inference time of <200 ms per scan, and stored results in PostgreSQL."
    ],
    technologies: ["TensorFlow", "Keras", "ResNet-50", "OpenCV", "Flask", "PostgreSQL"]
  }
];

export const CONTACT = {
  address: "431 Curry Ave, Windsor, Ontario, Canada",
  phoneNo: "+1 (437) 556 9983 ",
  email: "mohammednihal281001@gmail.com",
};