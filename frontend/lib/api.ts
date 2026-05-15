<<<<<<< Updated upstream
export * from "../../lib/api";
=======
export const fetchProductAnalysis = async (productId: string) => {
  // Backend olmasa bile 100ms sonra veriyi dön ki sayfa takılmasın
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        conversion_rate: 18.5,
        risk_score: 30,
        persona_count: 4,
        risk_level: "MEDIUM"
      });
    }, 100);
  });
};
>>>>>>> Stashed changes
