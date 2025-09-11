const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const { useDB, useAI, useLogger, useClient, useConfig } = require("@zibot/zihooks");
const config = useConfig();
const client = useClient();

const promptBuilder = async ({ content, user, lang, DataBase }) => {
	const { promptHistory, CurrentAI, CurrentUser } = (await DataBase.ZiUser.findOne({ userID: user?.id })) || {};

	const lowerContent = content?.toLowerCase()?.trim();
	const language = lang?.local_names || "vi_VN";

	const old_Prompt = `${
		promptHistory ??
		`You are a supportive companion AI that encourages and motivates users. You are friendly, empathetic, and always positive, helping users feel empowered and inspired and don't use icons.`
	}\n${user?.username}: ${CurrentUser} \n${client.user.username}: ${CurrentAI}`.slice(-13000);

	const userPrompt = lowerContent ? `${user?.username} có câu hỏi: ${lowerContent}` : "How can I assist you today?";

	const Prompt =
		language === "vi_VN" ?
			`Context:\n${old_Prompt}\nPrompt: ${userPrompt}, Hãy trả lời bằng tiếng Việt.`
		:	`Context:\n${old_Prompt}\nPrompt: ${userPrompt}, Please respond in ${language}.`;
	//16384 token

	return { Prompt, old_Prompt };
};

module.exports = async () => {
	try {
		if (!config.DevConfig.ai || !process.env?.OPENAI_API_KEY?.length) return;

		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY
		});
		const DataBase = useDB();

		useAI({
			client,
			openai,
			run: async (prompt, user, lang) => {
				const { Prompt, old_Prompt } = await promptBuilder({ content: prompt, user, lang, DataBase });
				console.log("Prompt:", Prompt);
				console.log("Old Prompt:", old_Prompt);
				
				const response = await openai.chat.completions.create({
					model: "gpt-4o-mini",
					messages: [{ role: "user", content: Prompt }],
					temperature: 0.8,
					max_tokens: 1000,
				});
				
				const text = response.choices[0]?.message?.content;

				if (!text) return "Lỗi khi gọi AI";
				if (!user) return text;

				await DataBase.ZiUser.updateOne(
					{ userID: user?.id },
					{
						$set: {
							promptHistory: old_Prompt,
							CurrentAI: text,
							CurrentUser: prompt,
						},
					},
					{ upsert: true },
				);

				return text;
			},
		});

		useLogger().info(`Successfully loaded Ai model.`);
	} catch (error) {
		useLogger().error("Lỗi khi tải Ai model:", error);
	}
};
