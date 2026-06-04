export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Auth: undefined;
  MovieDetail: { movieId: number; title: string };
  TVDetail: { tvId: number; title: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};
