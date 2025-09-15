// Тест RLS через JavaScript/Node.js
// Виконайте в браузерній консолі або Node.js

// 1. Тест без токену (анонімний доступ)
async function testAnonymousAccess() {
  console.log("=== Testing Anonymous Access ===");
  try {
    const response = await fetch(
      "https://iyrgkgaqjknobazvtyqi.supabase.co/rest/v1/users",
      {
        method: "GET",
        headers: {
          apikey: "YOUR_ANON_KEY", // Замініть на ваш anon key
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Status:", response.status);
    console.log("Response:", await response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

// 2. Тест з токеном (аутентифікований доступ)
async function testAuthenticatedAccess(accessToken) {
  console.log("=== Testing Authenticated Access ===");
  try {
    const response = await fetch(
      "https://iyrgkgaqjknobazvtyqi.supabase.co/rest/v1/users",
      {
        method: "GET",
        headers: {
          apikey: "YOUR_ANON_KEY", // Замініть на ваш anon key
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Status:", response.status);
    console.log("Response:", await response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

// 3. Тест конкретного користувача
async function testSpecificUser(accessToken, userId) {
  console.log("=== Testing Specific User Access ===");
  try {
    const response = await fetch(
      `https://iyrgkgaqjknobazvtyqi.supabase.co/rest/v1/users?id=eq.${userId}`,
      {
        method: "GET",
        headers: {
          apikey: "YOUR_ANON_KEY", // Замініть на ваш anon key
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Status:", response.status);
    console.log("Response:", await response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

// Використання:
// 1. Відкрийте браузерну консоль на вашому сайті
// 2. Скопіюйте цей код
// 3. Замініть YOUR_ANON_KEY на ваш anon key
// 4. Отримайте access token з localStorage або sessionStorage
// 5. Викличте функції:

// testAnonymousAccess();
// testAuthenticatedAccess('YOUR_ACCESS_TOKEN');
// testSpecificUser('YOUR_ACCESS_TOKEN', 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39');

