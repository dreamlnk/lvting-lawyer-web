// 测试前后端连接
const testLogin = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  
  console.log('测试登录API...');
  console.log('API地址:', apiUrl);
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'lvting2026'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 登录成功！');
      console.log('Token:', data.data.token.substring(0, 50) + '...');
      console.log('管理员:', data.data.admin.name);
      return data.data.token;
    } else {
      console.log('❌ 登录失败:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
    return null;
  }
};

testLogin();
