import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../api/api';
import Navbar from '../components/Navbar';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera, Add, Close } from '@mui/icons-material';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.profile.name || '',
        bio: user.profile.bio || '',
        skills: user.profile.skills || [],
      });
      setPreviewUrl(user.profile.imageUrl || getDefaultImageUrl(user.role));
    }
  }, [user]);

  const getDefaultImageUrl = (role: 'mentor' | 'mentee') => {
    return role === 'mentor' 
      ? 'https://placehold.co/500x500.jpg?text=MENTOR'
      : 'https://placehold.co/500x500.jpg?text=MENTEE';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (1MB)
      if (file.size > 1024 * 1024) {
        setMessage({ type: 'error', text: '이미지 크기는 1MB 이하여야 합니다.' });
        return;
      }

      // 파일 형식 검증
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setMessage({ type: 'error', text: 'JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.' });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let imageBase64 = '';
      if (selectedFile) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // base64 부분만 추출
          };
          reader.readAsDataURL(selectedFile);
        });
      }

      const updateData = {
        id: user.id,
        name: formData.name,
        role: user.role,
        bio: formData.bio,
        ...(imageBase64 && { image: imageBase64 }),
        ...(user.role === 'mentor' && { skills: formData.skills }),
      };

      const response = await userAPI.updateProfile(updateData);
      updateUser(response.data);
      setMessage({ type: 'success', text: '프로필이 성공적으로 업데이트되었습니다.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '프로필 업데이트에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
            프로필 관리
          </Typography>
          
          {message.text && (
            <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box textAlign="center" mb={4}>
              <Avatar
                id="profile-photo"
                src={previewUrl}
                alt="프로필 이미지"
                sx={{ width: 150, height: 150, margin: '0 auto', mb: 2 }}
              />
              <input
                id="profile"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="profile">
                <IconButton color="primary" component="span">
                  <PhotoCamera />
                </IconButton>
                <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                  이미지 변경
                </Typography>
              </label>
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                id="name"
                name="name"
                label="이름"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                id="bio"
                name="bio"
                label="소개글"
                value={formData.bio}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
                variant="outlined"
              />
            </Box>

            {user.role === 'mentor' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  기술 스택
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    id="skillsets"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="기술 스택을 입력하고 Enter를 누르세요"
                    variant="outlined"
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    onClick={addSkill}
                    variant="outlined"
                    startIcon={<Add />}
                    size="small"
                  >
                    추가
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      onDelete={() => removeSkill(skill)}
                      deleteIcon={<Close />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Button
              id="save"
              type="submit"
              disabled={isLoading}
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4 }}
            >
              {isLoading ? <CircularProgress size={24} /> : '프로필 저장'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Profile;
