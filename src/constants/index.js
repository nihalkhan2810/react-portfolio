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

export const HERO_CONTENT = `I'm an AI & Full Stack Engineer who enjoys building things that actually work in the real world. Most of what I do revolves around AI systems, web apps, and backend automation—anything that combines logic with creativity. Right now, I work as an AI & Full Stack Developer at NexApproach, where I build secure, low-latency systems using tools like LangChain, OpenAI APIs, and AWS. I’ve shipped features that handle hundreds of concurrent users, optimized API performance, and helped design workflows that make AI more reliable and less expensive to run.
Before that, I completed my M.Eng in Electrical & Computer Engineering at the University of Windsor, which strengthened my foundations in signal processing, embedded systems, and applying AI in practical ways. On the technical side, I'm comfortable across the stack—Python, TypeScript, React/Next.js, Tailwind, and cloud tools like Lambda, DynamoDB, Docker. I enjoy taking an idea from a rough concept, turning it into something clean and usable, and making sure it runs smoothly in production. At the end of the day, I like building solutions that are simple, efficient, and meaningful for the people using them.`;

export const ABOUT_TEXT = `I take a practical and grounded approach to AI, focusing on building systems that genuinely solve real problems. With a Master’s in Electrical & Computer Engineering from the University of Windsor and a Bachelor’s in Information Technology from Sathyabama University, I’ve built a strong foundation that supports the work I do today. I currently work as an AI & Full Stack Developer at NexApproach, where I build and deploy AI features using LangChain, OpenAI APIs, and AWS. A lot of my work revolves around improving performance, reducing latency, and making sure the systems we ship are reliable at scale. My experience spans computer vision, machine learning, and large language models. I’ve worked on projects involving RAG systems, document analysis, automated pipelines, and end-to-end applications that blend AI with clean frontend experiences. I’m also comfortable across the stack, using tools like React, Next.js, and Tailwind to turn ideas into functional products. Outside of work, I like staying up to date with new developments in AI and working on personal projects whenever I can. Sports and fitness keep me balanced, and I’m always looking to grow, contribute, and build technology that actually makes a difference.
`;

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
    year: "May 2025 - Present",
    role: "AI & Full Stack Engineer",
    company: "NexApproach",
    summary:
      "Building an AI-powered, high-performance web platform on AWS, focusing on low-latency architectures, secure APIs, and reliable GPT-4 integrations.",
    description: [
      "Engineered a high-performance Next.js platform with LangChain, supporting 500+ simultaneous users through real-time WebSockets and tuned SSR for fast, consistent response times.",
      "Architected a resilient AWS setup using Lambda (Node 18.x), API Gateway with custom auth, and DynamoDB, achieving sub-100ms end-to-end latency and around 99.5% service availability.",
      "Delivered secure, scalable REST APIs with JWT-based authentication and 100 req/min rate limiting, while integrating GPT-4 into cost-optimized, fault-tolerant workflows for production use."
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "LangChain",
      "Node.js",
      "AWS Lambda",
      "API Gateway",
      "DynamoDB",
      "WebSockets",
      "GPT-4",
      "JWT"
    ]
  },
  {
    year: "April 2020 - May 2023",
    role: "Research Assistant",
    company: "Sathyabama Institute",
    summary:
      "Developed a CNN-based pipeline for larvae identification and optimized real-time edge deployments.",
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