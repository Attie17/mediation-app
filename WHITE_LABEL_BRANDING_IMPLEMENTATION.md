# White-Label Organization Branding Implementation

## ✅ What's Been Implemented

### 1. Database Schema (`003-add-organization-branding.sql`)
Added branding columns to `organizations` table:
- **`primary_color`** - Main brand color (hex code, default: #3b82f6)
- **`secondary_color`** - Accent color (hex code, default: #10b981)
- **`logo_url`** - Organization logo URL
- **`tagline`** - Organization tagline/slogan
- **`custom_domain`** - For white-label portals (future use)
- **`branding_config`** - JSON field for additional settings

### 2. Backend API (`/backend/src/routes/organizations.js`)
- **`GET /api/organizations/:id/branding`** - Public endpoint to fetch organization branding
  - No admin auth required (mediators/divorcees can load their org branding)
  - Returns: logo, colors, tagline, contact info
- **`PUT /api/organizations/:id`** - Updated to accept branding fields

### 3. Frontend Context (`BrandingContext.jsx`)
Automatically loads organization branding based on user type:
- **Mediators**: Loads branding from their `organization_id`
- **Divorcees**: Loads branding from their case's organization
- **Admins/Lawyers**: Uses default branding
- Applies custom CSS variables (`--brand-primary`, `--brand-secondary`)

### 4. UI Components

**`OrganizationBrand.jsx`** - Displays logo + name with custom colors
- Sizes: sm, md, lg, xl
- Shows tagline optionally
- Falls back to icon if no logo

**`BrandedButton.jsx`** - Buttons using organization colors
- Variants: primary, secondary, outline
- Auto-applies custom colors or defaults to Tailwind

**`EditOrganizationModal.jsx`** - Enhanced with branding section
- Logo URL input with live preview
- Color pickers (primary & secondary)
- Tagline input
- Visual preview of branding

## 🎯 How It Works

### Admin Flow:
1. Admin creates/edits organization in `/admin/organizations`
2. Sets logo URL, colors, tagline in "White-Label Branding" section
3. Branding saved to database

### User Experience:
1. **Mediator** logs in → `BrandingProvider` loads their org branding
2. **Divorcee** accesses case → Loads mediator's org branding
3. Custom colors applied via CSS variables
4. Logo displays in navigation/headers
5. Buttons use organization colors

## 📋 Testing Checklist

### In Browser:
1. **Navigate to** `/admin/organizations`
2. **Click Edit** on an organization
3. **Scroll to "White-Label Branding" section**
4. **Set branding**:
   - Tagline: "Professional Divorce Mediation"
   - Logo URL: `https://via.placeholder.com/150x50/1e40af/ffffff?text=MediationCo`
   - Primary Color: #1e40af (dark blue)
   - Secondary Color: #059669 (green)
5. **Save** changes
6. **Test as mediator**:
   - Sign in as a mediator from that organization
   - Should see custom branding in UI
7. **Test as divorcee**:
   - Sign in as divorcee with case from that organization
   - Should see mediator's organization branding

## 🔧 Usage Examples

### Display Organization Logo:
```jsx
import OrganizationBrand from './components/branding/OrganizationBrand';

<OrganizationBrand size="lg" showTagline={true} />
```

### Use Branded Buttons:
```jsx
import BrandedButton from './components/branding/BrandedButton';

<BrandedButton variant="primary">Continue</BrandedButton>
<BrandedButton variant="secondary">Save Draft</BrandedButton>
<BrandedButton variant="outline">Cancel</BrandedButton>
```

### Access Branding Data:
```jsx
import { useBranding } from './context/BrandingContext';

function MyComponent() {
  const { branding, loading } = useBranding();
  
  return (
    <div style={{ color: branding.primaryColor }}>
      {branding.displayName}
    </div>
  );
}
```

## 🚀 Next Steps (Future Enhancements)

1. **File Upload** - Allow admins to upload logos instead of URLs
2. **Custom Domains** - Route `mediation.clientco.com` to specific org
3. **Email Templates** - Use org branding in notification emails
4. **PDF Reports** - Include org logo/colors in generated documents
5. **Font Customization** - Allow custom fonts in `branding_config`
6. **Dark/Light Mode** - Per-organization theme preferences
7. **Branding Preview** - Live preview before saving

## 📝 Files Created/Modified

### Created:
- `backend/migrations/003-add-organization-branding.sql`
- `frontend/src/context/BrandingContext.jsx`
- `frontend/src/components/branding/OrganizationBrand.jsx`
- `frontend/src/components/branding/BrandedButton.jsx`

### Modified:
- `backend/src/routes/organizations.js` (added branding endpoint)
- `frontend/src/App.jsx` (wrapped with BrandingProvider)
- `frontend/src/components/admin/EditOrganizationModal.jsx` (added branding fields)

## 🎨 Architecture

```
┌─────────────────────────────────────────┐
│         Admin Dashboard                 │
│  ┌─────────────────────────────────┐   │
│  │  Edit Organization              │   │
│  │  - Logo URL                     │   │
│  │  - Primary Color: #1e40af       │   │
│  │  - Secondary Color: #059669     │   │
│  │  - Tagline                      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  │
                  │ Saves to DB
                  ▼
┌─────────────────────────────────────────┐
│      Organizations Table                │
│  - primary_color                        │
│  - secondary_color                      │
│  - logo_url                             │
│  - tagline                              │
└─────────────────────────────────────────┘
                  │
                  │ API: GET /api/organizations/:id/branding
                  ▼
┌─────────────────────────────────────────┐
│      BrandingContext (React)            │
│  - Loads on user login                  │
│  - Applies CSS variables                │
│  - Provides branding to all components  │
└─────────────────────────────────────────┘
                  │
                  │ Used by
                  ▼
┌─────────────────────────────────────────┐
│   UI Components                         │
│  - OrganizationBrand (logo/name)        │
│  - BrandedButton (custom colors)        │
│  - Headers, footers, etc.               │
└─────────────────────────────────────────┘
```

## 🎯 Business Value

- **Multi-tenant SaaS**: Each mediation firm gets their own branded experience
- **White-label**: Firms can present platform as their own service
- **Professional**: Custom branding increases trust with clients
- **Scalable**: Easy to add new organizations without code changes
