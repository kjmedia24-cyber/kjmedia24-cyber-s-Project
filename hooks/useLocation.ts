import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { useGameStore } from "../store/gameStore";

export function useLocation() {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setLocation = useGameStore((s) => s.setLocation);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionGranted(false);
        setError("위치 권한이 필요해요. 설정에서 허용해주세요!");
        return;
      }
      setPermissionGranted(true);

      // 현재 위치 즉시 가져오기
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ lat: current.coords.latitude, lng: current.coords.longitude });

      // 위치 변화 구독
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
        (loc) => {
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { permissionGranted, error };
}
