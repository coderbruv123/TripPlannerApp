export type TripResultsParams = {
  savedTripId?: string;
  url?: string;
  title?: string;
  country?: string;
  from?: string;
  to?: string;
  travelers?: number;
  budget?: string;
  originLabel?: string;
  originLat?: number;
  originLng?: number;
  destinationName?: string;
  destinationCountry?: string;
  destinationLat?: number;
  destinationLng?: number;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  TripResults: TripResultsParams | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  SavedTrips: undefined;
  Stays: undefined;
  Profile: undefined;
};
