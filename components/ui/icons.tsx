// components/ui/icons.tsx
'use client'

// **CORRECTION**: All icons used by the components are now imported and exported correctly.
import {
  Check,
  Copy,
  RefreshCw,
  Plus,
  ChevronRight,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  SunMedium,
  Moon,
  Laptop,
  MoreHorizontal,
  ArrowUp,
  Link,
  Trash,
  PlusCircle,
  Share,
  Command,
  Bot,
  FileText,
  FileImage,
  FileJson,
  FileQuestion,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  X,
  Search,
  Play,
  StopCircle,
  CopyCheck,
  RotateCw,
  Split,
  Grip,
  Pin,
  PinOff,
  Settings,
  Info,
  CircleEllipsis,
  Book,
  MessageCircle,
  MessageSquare,
  Video,
  Github,
  Image as ImageIcon // Alias Image to avoid conflicts
} from 'lucide-react'

// Exporting each icon with a consistent name.
export const IconCheck = Check
export const IconCopy = Copy
export const IconRefresh = RefreshCw
export const IconPlus = Plus
export const IconChevronRight = ChevronRight
export const IconUser = User
export const IconEye = Eye
export const IconEyeOff = EyeOff

// Re-exporting other icons for general use.
export {
  Loader2,
  ArrowRight,
  SunMedium,
  Moon,
  Laptop,
  MoreHorizontal,
  ArrowUp,
  Link,
  Trash,
  PlusCircle,
  Share,
  User as UserIcon,
  Command,
  Bot,
  FileText,
  FileImage,
  FileJson,
  FileQuestion,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  X,
  Search,
  Play,
  StopCircle,
  CopyCheck,
  RotateCw,
  Split,
  Grip,
  Pin,
  PinOff,
  Settings,
  Info,
  CircleEllipsis,
  ImageIcon,
  Book,
  MessageCircle,
  MessageSquare,
  Video,
  Github
}