import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../api/api';
import Navbar from '../components/Navbar';

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
    <div>
      <Navbar />
      <div style={{
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>프로필 관리</h2>
        
        {message.text && (
          <div style={{
            backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
            color: message.type === 'error' ? '#721c24' : '#155724',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              id="profile-photo"
              src={previewUrl}
              alt="프로필 이미지"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #dee2e6',
                marginBottom: '1rem',
              }}
            />
            <div>
              <input
                id="profile"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="profile"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              >
                이미지 변경
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="bio" style={{ display: 'block', marginBottom: '0.5rem' }}>
              소개글
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>

          {user.role === 'mentor' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="skillsets" style={{ display: 'block', marginBottom: '0.5rem' }}>
                기술 스택
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  id="skillsets"
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="기술 스택을 입력하고 Enter를 누르세요"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  추가
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#e9ecef',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            id="save"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '저장 중...' : '프로필 저장'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
