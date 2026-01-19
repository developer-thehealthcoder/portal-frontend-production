import ResetPasswordForm from "@/components/foundation-kit/auth/reset-password";

const Home = async ({ params }) => {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
};

export default Home;
