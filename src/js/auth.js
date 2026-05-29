export function initAuth() {
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');

  const currentUser = {
    uid: 'admin123',
    name: '김태형',
    role: 'ADMIN',
    email: 'admin@site-master.com'
  };

  if (userName) userName.textContent = `${currentUser.name}님`;
  if (userRole) userRole.textContent = currentUser.role === 'ADMIN' ? '총괄 관리자' : '현장 팀원';
  if (userAvatar) userAvatar.textContent = currentUser.name.substring(0, 2);
}

// Permission Helper
export function hasPermission(requiredRole) {
  // Logic to check role against user data
  return true; 
}
