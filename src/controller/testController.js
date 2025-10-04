export const getTestError = async (req, res) => {
  throw new Error('Simulated server error');
};
