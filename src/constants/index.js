import project1 from "../assets/projects/project-1.jpg";
import project2 from "../assets/projects/project-2.jpg";
import project3 from "../assets/projects/project-3.jpg";

export const HERO_CONTENT = `I am a passionate AI Engineer and Researcher with 3+ years of experience in building scalable deep learning systems and practical AI solutions. My expertise spans computer vision (CNNs, OpenCV), machine learning (PyTorch, TensorFlow), and cloud deployment (AWS, Kubernetes). I specialize in creating end-to-end solutions, from model development to production-ready pipelines, with a strong foundation in full-stack development using React and Flask. My goal is to leverage cutting-edge AI technologies to solve real-world problems while delivering robust, efficient, and user-friendly solutions.`;

export const ABOUT_TEXT = `As an AI Engineer and Researcher, I bring a unique blend of technical expertise and problem-solving skills to every project. With a Master's in Electrical & Computer Engineering from the University of Windsor and a Bachelor's in Information Technology from Sathyabama Institute, I’ve built a strong foundation in both theoretical and practical aspects of technology. My journey began with a fascination for how machines can learn and has evolved into a career focused on creating intelligent systems that solve real-world challenges.

I specialize in computer vision, deep learning, and natural language processing (NLP), with hands-on experience in tools like PyTorch, TensorFlow, and AWS. My work with Large Language Models (LLMs) includes fine-tuning and deploying models using Hugging Face and LangChain, enabling applications like intelligent chatbots, document analysis, and automated metadata tagging. Beyond AI, I’m also proficient in full-stack development, having built this very website using React. I thrive in collaborative environments where I can contribute to innovative solutions while continuously learning and adapting to new technologies.

When I’m not coding, you’ll find me exploring the latest advancements in AI, contributing to open-source projects, or staying active through sports and fitness. My goal is to keep pushing the boundaries of what’s possible with technology while delivering impactful, user-friendly solutions.`;

export const EXPERIENCES = [
  {
    year: "Dec 2022 - Jan 2023",
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
    image: "https://picsum.photos/160/160?random=1", // Thumbnail
    images: [
      "https://picsum.photos/128/128?random=1",
      "https://picsum.photos/128/128?random=2",
      "https://picsum.photos/128/128?random=3"
    ], // Gallery images
    summary: "Trained a CNN to recognize ASL hand gestures with high accuracy on Raspberry Pi hardware.",
    details: [
      "Trained a TensorFlow-based CNN on 5000+ ASL images, achieving 98% test accuracy with <5 ms inference time on Raspberry Pi hardware.",
      "Reduced misclassification in low-light conditions by 15% using adaptive histogram equalization and synthetic data augmentation."
    ],
    technologies: ["TensorFlow", "Raspberry Pi", "Python"]
  },
  {
    title: "Fish-Species Identification Using Deep Learning",
    image: "https://picsum.photos/160/160?random=2", // Thumbnail
    images: [
      "https://picsum.photos/128/128?random=4",
      "https://picsum.photos/128/128?random=5",
      "https://picsum.photos/128/128?random=6"
    ], // Gallery images
    summary: "Designed a deep learning pipeline to classify fish species with high accuracy.",
    details: [
      "Designed a PySpark pipeline on AWS EMR to classify 20+ fish species, achieving 90% accuracy with a VGG-16 model trained on 1000+ images.",
      "Automated metadata tagging using BERT and stored results in Snowflake for collaborative analytics."
    ],
    technologies: ["PySpark", "AWS EMR", "VGG-16", "BERT", "Snowflake"]
  },
  {
    title: "Identification of Brain Tumor Using CNN",
    image: "https://picsum.photos/160/160?random=3", // Thumbnail
    images: [
      "https://picsum.photos/128/128?random=7",
      "https://picsum.photos/128/128?random=8",
      "https://picsum.photos/128/128?random=9"
    ], // Gallery images
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
  address: "767 Fifth Avenue, New York, NY 10153 ",
  phoneNo: "+12 4555 666 00 ",
  email: "me@example.com",
};