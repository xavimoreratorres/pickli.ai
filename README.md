## Inspiration

Our project began with a desire to solve a problem we and many of our friends and family encounter daily, making this experiment impactful not only for us but also for our loved ones. We, Sofi and Xavi, are a married couple both working in digital product development: Sofi as a Product Designer at DMI, a U.S.-based digital consultancy, and Xavi as a Product Manager at N26, a German neobank.

In our work and conversations, we often discuss issues that create friction in our lives, considering how they might be improved. One recurring frustration was the challenge of selecting a relevant movie or TV show quickly and easily, without endlessly scrolling through platforms. Nothing seemed to fully address this need. This was validated when we discovered in Nielsen's “2023 State of Play” report that viewers spend an average of 10.5 minutes per session choosing what to watch on streaming services. Nearly half (46%) feel overwhelmed by the growing number of services, which makes finding content more challenging. Additionally, 95% of Americans now pay for multiple streaming services, and in Europe, 45% of viewers have three or more subscriptions.

Despite using Gemini for recommendations with a custom "Gem," we still found ourselves repeatedly prompting it, often with disappointing results. Many suggestions were irrelevant to us because they were unavailable on our preferred platforms, out of region (we’re based in Spain), or even nonexistent titles. 

This realization led us to see Gemini’s potential for solving our issue—but only if we could integrate it with function calling and structured output. By connecting to external APIs, we could ensure recommendations aligned with our preferences and local availability. The external API would link to a library of movies and TV shows, with metadata including titles and platform availability by country. Structured output would ensure these results could be reliably rendered in an interface, creating a seamless and relevant recommendation experience.

## What It Does

Our solution performs six key functions to deliver a streamlined, tailored experience for the user:

1. **User-Centric Interface**: Offers a carefully designed, minimalist interface optimized for quickly delivering relevant results. The interface adheres to best UX practices, featuring three main, research-backed categories and tags that enable high levels of user customization.

2. **Dynamic Prompt Creation**: Converts all user inputs from the interface (e.g., button clicks, form entries) into a dynamic natural language prompt structure. Through our experiments in Google AI Studio, we observed that Gemini 1.5 Pro and Flash models perform slightly better with natural language prompts than with JSON arrays, enhancing model response quality.

3. **Dual-Path Recommendation Generation**: Generates two branches of recommendations based on user preferences, one using Gemini 1.5 Pro with a low temperature setting (0.2) and another at a high temperature setting (2). This approach introduces a balance of consistency and variety in the suggestions.

4. **Platform and Availability Filtering**: Filters suggestions to match the user’s chosen platforms and country-specific availability. This is achieved by connecting to an extensive external API of movies and series, enriched with metadata such as images and direct platform links.

5. **False Positive Cleanup**: Uses Gemini Flash 8B to eliminate false positive matches from the external API ensuring accurate results when multiple records (e.g., "Terminator 2" returns 19 different records in the database).

6. **“Judge AI” Rating and Explanation**: Routes filtered recommendations to a “Judge AI,” a Gemini 1.5 Pro model that rates, sorts, and explains each recommendation’s alignment with user preferences. The structured output is then sent back to the frontend, providing clarity and enhancing the user’s decision-making experience.

## How We Built It

We broke down the solution into three core components: **UX/UI Interface Design**, **Prompt and System Instructions Design**, and **Backend Architecture Design**.

### UX/UI Interface Design
For the interface, we used Figma with Dev Mode to efficiently export designs to HTML and CSS. Gemini Assistant aided us in implementing JavaScript for UI interactions. Our design consists of three main pages:
- **Index.html**: This page allows the user to select their preferences, which then dynamically generates a prompt behind the scenes.
- **Loading.html**: This page triggers the backend process through the entry point HTTP function “pickli-recs-5.”
- **Results2.html**: After receiving results from the backend, this page displays recommendations as “Cards” representing each suggested title.

### Prompt and System Instructions Design
We utilized Google AI Studio to refine the prompt and system instructions until achieving the desired quality and format for all our Gemini calls:
- **Rater**: A Gemini 1.5 Pro instance that evaluates all recommendations for relevancy, sorts them, and generates a brief explanation to inform the user about each recommendation’s alignment with their preferences.
- **Recommenders**: Two Gemini 1.5 Pro instances that each generate a batch of 10 recommendations tailored to user preferences. One runs at a low temperature (0.2) and the other at a high temperature (2) to introduce both consistency and variety.
- **Fallback LLM**: An instance of Gemini Flash 8B, used to match the desired title across multiple results in the database, ensuring precise title selection.

### Backend Architecture Design
The backend is entirely built on Google Cloud, consisting of a series of HTTP Trigger Functions in a sequential flow:
- **Pickli-recs-5**: This function receives the user-generated prompt and platform data from the frontend and calls **GetRecs** with two temperature settings (0.2 and 2).
- **GetRecs**: This function generates a batch of 10 recommendations based on the prompt and then calls **GetPlatforms**, providing it with titles, release years, show type (Movie or Series), user’s country, and selected platforms.
- **GetPlatforms**: This function searches the external API for the specified titles. When multiple results are found, it matches by exact title, release year, or the closest year. If no unique match is identified, **Platform-fallback** is triggered.
- **Platform-fallback**: This function provides unique IDs from the external API, aligning each recommended title with the correct unique ID using the “overview” external API field that describes each title and returning it to **GetPlatforms**.

After processing, all available titles with metadata flow back through the functions to **Pickli-recs-5**, which uses Gemini 1.5 Pro for final rating and sorting. The recommendations are returned in JSON format, ready for the frontend's **loading.html** script, which stores them locally and renders them in **results2.html**.

## Challenges We Ran Into

We encountered several challenges, but two stood out:

1. **Single Title Request Limitation in External APIs**: 
   All the relevant external APIs we found only accepted one title per request, posing a challenge. Based on our experience, we knew that Gemini’s knowledge about platform availability in specific countries was limited. Therefore, we decided not to restrict Gemini with platform availability in the prompt, as it could introduce bias, potentially causing actual titles available on our platforms to be overlooked due to incorrect assumptions of Gemini’s grounded knowledge. Instead, we configured Gemini’s suggestions solely by using User Input as specified in a pre-structured prompt from the frontend JavaScript and showType (Movie or Series).

   However, this unbiased approach of not sharing the desired platforms and country to the Gemini suggestion-makers presented a new issue: through testing in AI Studio, we observed that only 10-20% of Gemini’s suggestions would be available on any of the user’s selected platforms in their country. To ensure at least three valid recommendations, we would need to run the Gemini 1.5 Pro model multiple times (at least between 5 to 30 times), which would be inefficient and lead to long wait times. To address this, we asked Gemini to generate batches of 10 suggestions per call, which we then checked against the external API one by one. We stored valid matches in our function and repeated this process until we had at least three matches for the user, sequentially removing the given suggestions from each future retry.

2. **Handling Duplicate and Inconsistent Records in External Libraries**: 
   External libraries presented a vast volume of records, including recently released movies in specific countries, multiple versions, and indie titles. Searching for a title like “Terminator 2” often returned 19 records instead of a single match. Furthermore, we couldn’t rely on Gemini to consistently produce an exact official title match, making it challenging to identify the correct title in the database. We noticed that Gemini often returned the correct release year alongside the title, so we adjusted the structured format to include both the title and year out of the gemini recommendation-makers.

   However, even with this structure, we sometimes received multiple results or cases where Gemini provided an incorrect release year. To handle these edge cases, we added a fallback function using Gemini Flash 8B. This function received a set of unique title IDs from the external API, along with descriptions of these movies or series and the title Gemini 1.5 Pro had originally suggested. Flash 8B would then return the exact title ID that best matched the intended database record, ensuring we captured only the precise titles we needed.

## Accomplishments That We Are Proud Of

We’re especially proud of two main accomplishments:

1. **Building and Launching an End-to-End Solution with Limited Technical Knowledge**: 
   We’re amazed that, despite our limited technical background, we managed to build and deploy a complete solution. This accomplishment is largely due to our use of Gemini Assistant, which guided us with best practices, provided code examples, and supported us through troubleshooting. This experience has been a huge milestone for us in expanding our technical skills.

2. **Creating a Product We Use Ourselves**: 
   Even though this project is still an experiment with room for improvement, it has reached a point where it genuinely meets our needs. We now use it to streamline our daily choices for movies and series, which is a rewarding testament to the solution’s practical value.

## What We Learned

1. **Prompt Engineering Requires UX Design**:
   In consumer-facing solutions, AI output needs to add genuine value for the end user, which makes UX design essential to prompt engineering. Initially, we assumed AI would naturally generate the best possible output, but through extensive iteration, we realized the importance of a user-centric approach. Structuring prompts and system instructions proved critical, as a complex solution would be ineffective without high-quality, user-focused output. Tools like Google AI Studio were fundamental in refining system instructions and prompts through iterative testing, and we learned that this process should happen early on, ideally with a simulation environment, even before building the infrastructure.

2. **Natural Language Outperforms Structured Input in Certain Use Cases**:
   Our experience showed that LLMs handle sentiment analysis and nuanced responses better with natural language input than with structured formats. This insight influenced our decision to convert user interface selections into a well-crafted natural language prompt via a middleman JavaScript layer rather than passing them as structured inputs. While LLMs can handle non-natural languages like programming code, they excel with human language, which allowed us to leverage Gemini’s strengths more effectively for qualitative results.

3. **Balancing Response Time, Model Performance, and Resource Usage**:
   Finding the optimal balance between response time, model performance, input tokens, and output tokens is challenging. We found that it’s better to start with an “overkill” setup using high-quality models like Gemini 1.5 Pro and then optimize after validating the solution. While some tasks may eventually be more efficient with models like Flash, beginning with the best models allowed us to achieve reliable results before considering resource optimizations. Starting strong and refining later can be more effective than starting with compromises unless resource constraints demand it.

## What’s Next for Pickli

### User Profiles for Personalized Experiences
Pickli is planning to introduce user accounts to retain information about your preferences, chosen platforms, favorite selections, and even titles you decide to skip. This will add valuable context to the recommendation system, allowing for results that are more relevant, varied, and less repetitive. By building a “history” of user interactions, Pickli can better understand patterns in user moods and preferences, leading to a richer, more personalized experience.

### Share Tailored Recommendations with Friends & Family
We envision a feature that lets users share personalized recommendations with friends and family, crafted to highlight why each suggestion is perfect for them. Instead of generic recommendations, our goal is to create meaningful, customized shares that resonate—recommendations that make recipients say, “This was made for me.” Research shows that 74% of viewers choose content based on their mood, and 64% are influenced by what their family and friends are watching (Source: PwC Consumer Intelligence Series 2021 video survey).

### Partnerships with Streaming Platforms
While Pickli already links users to streaming platforms through the “Watch” feature, we’re exploring deeper partnerships to enhance user engagement. This could allow us to improve user experiences while potentially benefiting from these interactions. Given that 20% of viewers experience decision fatigue and ultimately skip watching content, Pickli aims to help platforms retain viewers and increase user engagement by reducing decision overload.

### Advanced Tailoring with “Custom Mode”
For users who prefer to take time refining their selections, Pickli plans to launch a “Custom Mode” that allows for detailed customization based on specific criteria. Whether users are looking for award-winning titles, specific genres, character-driven stories, or precise pacing and mood, this mode will offer in-depth personalization without the overwhelm. Our goal is to make every recommendation accurate and valuable, helping users choose what matters most to them at any given moment.

### Smart TV Integration
We envision bringing Pickli’s personalized recommendations directly to Smart TVs, allowing seamless access across all streaming subscriptions from the comfort of users’ living rooms. This would provide an intuitive way to browse, decide, and explore content, and we’re exploring potential partnerships with TV manufacturers to enhance this experience.

### Save for Later and Favorites
Our vision includes a “Save for Later” option and the ability to mark favorites, allowing users to build a personal library of must-watch content. This feature ensures that users can easily revisit recommendations without needing to repeat searches, giving them a curated list of future viewing options.

### User Feedback and Smart Adaptation
We’re exploring a feedback system where users can quickly indicate whether they enjoyed a recommendation. This feedback would help refine future suggestions, combining historical preferences with real-time inputs to adapt to users’ evolving tastes. Unlike traditional recommendation engines, this approach will prioritize new discoveries while enhancing contextually relevant, mood-based recommendations.

### Continuous UX Improvements for Quick Mode
We recognize that Quick Mode can be further refined, and we are dedicated to ongoing UX improvements. Our objective is to make finding your next favorite show or movie even more seamless, intuitive, and delightful.
