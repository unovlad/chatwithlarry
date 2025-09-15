// Тест RLS в браузері
// Відкрийте браузерну консоль на вашому сайті і виконайте цей код

// 1. Отримати Supabase клієнт з вашого додатку
const supabase = window.supabase || window.createClient;

// 2. Отримати поточну сесію
async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    console.log("Current session:", session);
    console.log("Session error:", error);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// 3. Тест доступу до users таблиці
async function testUsersAccess() {
  console.log("=== Testing Users Table Access ===");

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", "ed90f4b8-9c4f-4072-b610-4c0c15fd7d39");

    console.log("Users query result:");
    console.log("Data:", data);
    console.log("Error:", error);
    console.log("Error code:", error?.code);
    console.log("Error message:", error?.message);

    return { data, error };
  } catch (error) {
    console.error("Exception in users query:", error);
    return { data: null, error };
  }
}

// 4. Тест з різними ролями
async function testWithDifferentRoles() {
  console.log("=== Testing with Different Roles ===");

  // Тест як анонімний користувач
  console.log("Testing as anonymous...");
  const { data: anonData, error: anonError } = await supabase
    .from("users")
    .select("count")
    .limit(1);

  console.log("Anonymous result:", { anonData, anonError });

  // Тест як аутентифікований користувач
  console.log("Testing as authenticated...");
  const { data: authData, error: authError } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  console.log("Authenticated result:", { authData, authError });
}

// 5. Перевірка JWT токену
async function checkJWTToken() {
  console.log("=== Checking JWT Token ===");

  const session = await getCurrentSession();
  if (session?.access_token) {
    console.log(
      "Access token exists:",
      session.access_token.substring(0, 20) + "...",
    );

    // Декодуємо JWT токен
    try {
      const payload = JSON.parse(atob(session.access_token.split(".")[1]));
      console.log("JWT payload:", payload);
      console.log("User ID from JWT:", payload.sub);
      console.log("Email from JWT:", payload.email);
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  } else {
    console.log("No access token found");
  }
}

// 6. Повний тест
async function runFullTest() {
  console.log("=== Running Full RLS Test ===");

  await checkJWTToken();
  await testUsersAccess();
  await testWithDifferentRoles();
}

// Використання:
// 1. Відкрийте браузерну консоль на вашому сайті
// 2. Скопіюйте цей код
// 3. Викличте функції:

// runFullTest();
// або окремо:
// getCurrentSession();
// testUsersAccess();
// checkJWTToken();

