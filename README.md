mobile-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── welcome.tsx
|   |   └── _layout.tsx
│   ├── (customer)/
│   │   ├── home/
│   │   │   ├── index.tsx
│   │   │   └── restaurant-details.tsx
│   │   ├── search/
│   │   │   └── index.tsx
│   │   ├── cart/
│   │   │   └── index.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── tracking.tsx
│   │   ├── profile/
│   │   │   └── index.tsx
│   │   └── _layout.tsx
│   ├── (driver)/
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── earnings/
|   |   |   ├── vehicle.tsx
│   │   │   └── index.tsx
│   │   ├── profile/
│   │   │   └── index.tsx
│   │   └── _layout.tsx
│   ├── (manager)/
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── restaurants/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   ├── create.tsx
│   │   │   └── menus/
│   │   │       ├── index.tsx
│   │   │       └── [id].tsx
│   │   ├── orders/
│   │   │   └── index.tsx
│   │   ├── analytics/
│   │   │   └── index.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   ├── customer/
│       ├── RestaurantCard.tsx
│       ├── MenuItem.tsx
│       ├── CartItem.tsx
│       └── OrderCard.tsx
├── constants/
│   ├── colors.ts
|   ├── theme.ts
│   ├── api.ts
│   └── config.ts
├── hooks/
│   ├── useAuth.tsx
│   ├── useLocation.ts
│   ├── useSocket.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
|   ├── manager.ts
│   ├── restaurant.ts
│   ├── order.ts
│   ├── driver.ts
│   └── menu.ts
├── store/
│   ├── cartStore.ts
│   
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── .env
├── app.json
├── package.json
└── tsconfig.json