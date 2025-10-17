# Quick Developer Login - Browser Console Commands

## Full Admin Access (Recommended)
```javascript
localStorage.setItem('token', 'dev-fake-token');
localStorage.setItem('user', JSON.stringify({
  id: '862b3a3e-8390-57f8-a307-12004a341a2e',
  email: 'admin@dev.local',
  name: 'Dev Admin',
  role: 'admin'
}));
localStorage.setItem('activeCaseId', '4');
localStorage.setItem('devMode', 'true');
location.reload();
```

## Quick Copy-Paste (One Line)
```javascript
localStorage.setItem('token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'862b3a3e-8390-57f8-a307-12004a341a2e',email:'admin@dev.local',name:'Dev Admin',role:'admin'}));localStorage.setItem('activeCaseId','4');localStorage.setItem('devMode','true');location.reload();
```

## Other Roles

### Mediator
```javascript
localStorage.setItem('token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'1a472c78-438c-4b3e-a14d-05ce39d5bfc2',email:'mediator@dev.local',name:'Dev Mediator',role:'mediator'}));localStorage.setItem('activeCaseId','4');localStorage.setItem('devMode','true');location.reload();
```

### Divorcee
```javascript
localStorage.setItem('token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'dev-divorcee-uuid',email:'divorcee@dev.local',name:'Dev Divorcee',role:'divorcee'}));localStorage.setItem('activeCaseId','4');localStorage.setItem('devMode','true');location.reload();
```

### Lawyer
```javascript
localStorage.setItem('token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'dev-lawyer-uuid',email:'lawyer@dev.local',name:'Dev Lawyer',role:'lawyer'}));localStorage.setItem('activeCaseId','4');localStorage.setItem('devMode','true');location.reload();
```

## Check Current Login
```javascript
console.log('User:', JSON.parse(localStorage.getItem('user')));
console.log('Token:', localStorage.getItem('token'));
```

## Logout
```javascript
localStorage.clear();
location.reload();
```
