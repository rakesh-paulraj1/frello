import api from "./api";

export interface BoardMember {
  id: string;
  name: string;
  email: string;
}

export const memberService = {


  getAllMembers: async (): Promise<BoardMember[]> => {
    const response = await api.get<{ data: BoardMember[] }>("/members");
    return response.data.data;
  },
};
